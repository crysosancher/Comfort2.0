import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useReducer, useState } from "react";
import axios from "axios";

import { ReturnHome } from "./ReturnHome";
import { Loader } from "./Loader";
import { ShareBtn } from "./ShareIcon";
import { useTrainAndStation } from "..";

// Recommendation algorithm
const findBestSeatCombinations = (seats, fromStation, toStation, routeData) => {
  if (!seats || seats.length === 0 || !routeData || routeData.length === 0)
    return [];

  // Get station sequence indices
  const fromIndex = routeData.findIndex(
    (s) => s.source_stn_code === fromStation,
  );
  const toIndex = routeData.findIndex((s) => s.source_stn_code === toStation);

  if (fromIndex === -1 || toIndex === -1 || fromIndex >= toIndex) return [];

  // Filter seats that have some availability in our journey range
  const availableSeats = seats.filter((seat) => {
    const seatFromIdx = routeData.findIndex(
      (s) => s.source_stn_code === seat.from,
    );
    const seatToIdx = routeData.findIndex((s) => s.source_stn_code === seat.to);
    // Seat is useful if it covers at least part of our journey
    return (
      seatFromIdx !== -1 &&
      seatToIdx !== -1 &&
      seatFromIdx <= toIndex &&
      seatToIdx > fromIndex
    );
  });

  if (availableSeats.length === 0) return [];

  // Find consecutive seat combinations that cover the full journey
  const recommendations = [];
  const journey = routeData.slice(fromIndex, toIndex + 1);
  const journeyStations = journey.map((s) => s.source_stn_code);

  // Group seats by coach for analysis
  const seatsByCoach = {};
  availableSeats.forEach((seat) => {
    if (!seatsByCoach[seat.coachName]) seatsByCoach[seat.coachName] = [];
    seatsByCoach[seat.coachName].push(seat);
  });

  // Try to find a single seat that covers the entire journey
  const fullJourneySeats = availableSeats.filter((seat) => {
    const seatFromIdx = routeData.findIndex(
      (s) => s.source_stn_code === seat.from,
    );
    const seatToIdx = routeData.findIndex((s) => s.source_stn_code === seat.to);
    return seatFromIdx <= fromIndex && seatToIdx >= toIndex;
  });

  if (fullJourneySeats.length > 0) {
    recommendations.push({
      type: "single",
      description: `Direct seat available for full journey (${fromStation} → ${toStation})`,
      seats: fullJourneySeats.slice(0, 3).map((s) => ({
        coach: s.coachName,
        berth: s.berthNumber,
        berthType: s.berthCode ? GIVE_BERTH_NAME(s.berthCode) : "Coach",
        from: s.from,
        to:
          routeData.findIndex((st) => st.source_stn_code === s.to) > toIndex
            ? toStation
            : s.to,
      })),
    });
  }

  // Find multi-hop recommendations (if no single seat covers everything)
  if (recommendations.length === 0) {
    // For each seat, calculate what portion of journey it covers
    const seatCoverage = availableSeats.map((seat) => {
      const seatFromIdx = routeData.findIndex(
        (s) => s.source_stn_code === seat.from,
      );
      const seatToIdx = routeData.findIndex(
        (s) => s.source_stn_code === seat.to,
      );
      const coveredFrom = Math.max(fromIndex, seatFromIdx);
      const coveredTo = Math.min(toIndex, seatToIdx);
      const coverageLength = coveredTo - coveredFrom + 1;
      return {
        ...seat,
        coverageStart: coveredFrom,
        coverageEnd: coveredTo,
        coverageLength,
      };
    });

    // Sort by coverage length descending
    seatCoverage.sort((a, b) => b.coverageLength - a.coverageLength);

    // Build recommendations by greedy approach - pick best seat, then find connecting seats
    const remainingJourney = [...journeyStations];
    const selectedSeats = [];
    let lastToIdx = fromIndex - 1; // Track the last "to" index used

    seatCoverage.forEach((seat) => {
      if (remainingJourney.length === 0) return;

      const seatFromIdx = routeData.findIndex(
        (s) => s.source_stn_code === seat.from,
      );
      const seatToIdx = routeData.findIndex(
        (s) => s.source_stn_code === seat.to,
      );

      // Skip if seat starts before or at our current position (no going backwards)
      if (seatFromIdx <= lastToIdx) return;

      // Check if this seat can help with remaining journey
      const neededIdx = remainingJourney.findIndex(
        (stn) =>
          routeData.findIndex((r) => r.source_stn_code === stn) >= seatFromIdx,
      );

      if (neededIdx !== -1) {
        const actualFrom = remainingJourney[neededIdx];
        const actualFromIdx = routeData.findIndex(
          (s) => s.source_stn_code === actualFrom,
        );

        if (seatFromIdx <= actualFromIdx && seatToIdx > actualFromIdx) {
          selectedSeats.push({
            ...seat,
            actualFrom: actualFrom,
            actualFromIdx: actualFromIdx,
          });
          // Remove stations covered by this seat
          const seatEndIdx = routeData.findIndex(
            (s) => s.source_stn_code === seat.to,
          );
          remainingJourney.splice(neededIdx, seatEndIdx - neededIdx + 1);
          lastToIdx = seatToIdx; // Update our position
        }
      }
    });

    if (selectedSeats.length > 0) {
      recommendations.push({
        type: "multi",
        description: `Recommended seat combination for ${fromStation} → ${toStation}`,
        seats: selectedSeats.slice(0, 5).map((s) => ({
          coach: s.coachName,
          berth: s.berthNumber,
          berthType: s.berthCode ? GIVE_BERTH_NAME(s.berthCode) : "Coach",
          from: s.actualFrom || s.from,
          to:
            routeData.findIndex((st) => st.source_stn_code === s.to) > toIndex
              ? toStation
              : s.to,
          coverage: `${s.actualFrom || s.from} → ${routeData.findIndex((st) => st.source_stn_code === s.to) > toIndex ? toStation : s.to}`,
        })),
      });
    }
  }

  return recommendations;
};

const handleTrains = (data, action) => {
  switch (action.type) {
    case "addData":
      return {
        ...data,
        allData: action.data,
        trainCoachType: action.coachTypeList,
      };

    case "coachChoice":
      return {
        ...data,
        selectedCoachType: action.coachType,
        filteredCoachList: data.allData.filter(
          ({ classCode }) => classCode === action.coachType,
        ),
        seatsToShow: [],
        selectedCoachNumber: "",
      };

    case "fetched_seats_of_coachType":
      return {
        ...data,
        fetchedSeatsOfCoachType: [
          ...data.fetchedSeatsOfCoachType,
          action.newCoach,
        ],
        seatsToShow: [],
      };

    case "fetched_seats_data":
      return {
        ...data,
        fetchedSeatsData: { ...data.fetchedSeatsData, ...action.newSeats },
        seatsToShow: [],
      };

    case "coach_number":
      return { ...data, selectedCoachNumber: action.newCoachNumber };

    case "seats_to_show":
      return { ...data, seatsToShow: action.availableSeats };

    case "route_data":
      return { ...data, routeData: action.routeData };

    case "recommendations":
      return { ...data, seatRecommendations: action.recommendations };

    default:
      throw Error(
        `SOme error occured in handlering train data, action type: ${action.type}`,
      );
  }
};

const GIVE_BERTH_NAME = (code) => {
  switch (code) {
    case "W":
      return "Window";

    case "S":
      return "Side";

    case "L":
      return "Lower";

    case "M":
      return "Middle";

    case "U":
      return "Upper";

    case "P":
      return "Side Upper";

    case "R":
      return "Side Lower";

    default:
      return code;
  }
};

const beautifyData = (obj) =>
  obj.reduce(
    (accu, curr) =>
      Object.keys(accu).includes(curr.coachName)
        ? { ...accu, [curr.coachName]: [...accu[curr.coachName], curr] }
        : { ...accu, [curr.coachName]: [curr] },
    {},
  );

export const TrainDetails = () => {
  const navigate = useNavigate();
  const { trainNo } = useParams();
  const [isLoading, setLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [routeOpen, setRouteOpen] = useState(false);
  const [recsOpen, setRecsOpen] = useState(true);

  const {
    trainsAndStationData: { jDate, showAllVacant, toStationCode },
  } = useTrainAndStation();

  const [trainNumber, trainName, fromSTN, toStationCodeFromURL] = [
    ...trainNo.split("from")[0].split("-"),
    trainNo.split("from")[1]?.split("to")[0],
    trainNo.split("from")[1]?.split("to")[1],
  ];

  const [
    {
      trainCoachType,
      filteredCoachList,
      selectedCoachType,
      fetchedSeatsOfCoachType,
      fetchedSeatsData,
      selectedCoachNumber,
      seatsToShow,
      routeData,
      seatRecommendations,
    },
    updateTrainComposition,
  ] = useReducer(handleTrains, {
    allData: [],
    trainCoachType: [],
    selectedCoachType: "",
    filteredCoachList: [],
    coachComposition: [],
    fetchedSeatsOfCoachType: [],
    fetchedSeatsData: {},
    selectedCoachNumber: "",
    seatsToShow: [],
    routeData: [],
    seatRecommendations: [],
  });

  const setTrainsData = (list) =>
    updateTrainComposition({
      type: "addData",
      data: list,
      coachTypeList: list?.reduce(
        (accu, { classCode }) =>
          accu.includes(classCode) ? accu : [...accu, classCode],
        [],
      ),
    });

  const [sortAscending, setSortAscending] = useState(true);
  const [sortType, setSortType] = useState("seatNumber"); // 'seatNumber' or 'distance'

  const fetchRoute = async () => {
    try {
      const res = await axios(
        `https://little-katlin-crysosancher-e5eb62fd.koyeb.app/trains/getRoute?trainNo=${trainNumber}`,
      );
      if (res.data.success) {
        updateTrainComposition({
          type: "route_data",
          routeData: res.data.data,
        });
      }
    } catch (error) {
      console.log("Route fetch error:", error);
    }
  };

  const fetchTrainComposition = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        "https://www.irctc.co.in/online-charts/api/trainComposition",
        { boardingStation: fromSTN, jDate: jDate, trainNo: trainNumber },
      );
      setTrainsData(res.data.cdd);
    } catch (eror) {
      navigate("/error");
    } finally {
      setLoading(false);
    }
  };

  const handleCoachTypeChoice = async (givenCoachType) => {
    updateTrainComposition({ type: "coachChoice", coachType: givenCoachType });

    if (!fetchedSeatsOfCoachType.includes(givenCoachType)) {
      setLoading(true);
      try {
        //https://little-katlin-crysosancher-e5eb62fd.koyeb.app/trains/getTrain/?trainNo=12345
        //https://grumpy-leather-jacket-eel.cyclic.app/train?trainNo=${trainNumber}
        const trainInfo = await axios(
          `https://little-katlin-crysosancher-e5eb62fd.koyeb.app/trains/getTrain/?trainNo=${trainNumber}`,
        );
        const res = await axios.post(
          "https://www.irctc.co.in/online-charts/api/vacantBerth",
          {
            boardingStation: fromSTN,
            cls: givenCoachType,
            jDate: jDate,
            remoteStation: fromSTN,
            trainNo: trainNumber,
            trainSourceStation: trainInfo.data.data.from_stn_code,
            chartType: 2,
          },
        );
        if (res.data.error === null) {
          updateTrainComposition({
            type: "fetched_seats_of_coachType",
            newCoach: givenCoachType,
          });
          if (showAllVacant) {
            updateTrainComposition({
              type: "fetched_seats_data",
              newSeats: { [givenCoachType]: beautifyData(res.data.vbd) },
            });
          } else {
            updateTrainComposition({
              type: "fetched_seats_data",
              newSeats: { [givenCoachType]: beautifyData(res.data.vbd) },
            });
          }
        } else {
          const res = await axios.post(
            "https://www.irctc.co.in/online-charts/api/vacantBerth",
            {
              boardingStation: fromSTN,
              cls: givenCoachType,
              jDate: jDate,
              remoteStation: fromSTN,
              trainNo: trainNumber,
              trainSourceStation: trainInfo.data.data.from_stn_code,
              chartType: 1,
            },
          );
          updateTrainComposition({
            type: "fetched_seats_of_coachType",
            newCoach: givenCoachType,
          });
          if (showAllVacant) {
            updateTrainComposition({
              type: "fetched_seats_data",
              newSeats: { [givenCoachType]: beautifyData(res.data.vbd) },
            });
          } else {
            updateTrainComposition({
              type: "fetched_seats_data",
              newSeats: { [givenCoachType]: beautifyData(res.data.vbd) },
            });
          }
        }
      } catch (eror) {
        navigate("/error");
      } finally {
        setLoading(false);
      }
    }
  };

  const fetchTotal = () =>
    Object?.keys(fetchedSeatsData?.[selectedCoachType])?.reduce(
      (total, current) =>
        total + fetchedSeatsData[selectedCoachType][current].length,
      0,
    );

  const handleCoachNumberChoice = (givenNumber) => {
    updateTrainComposition({
      type: "coach_number",
      newCoachNumber: givenNumber,
    });
    if (givenNumber === "All") {
      updateTrainComposition({
        type: "seats_to_show",
        availableSeats: Object.keys(fetchedSeatsData[selectedCoachType]).reduce(
          (accu, curr) => [
            ...accu,
            ...fetchedSeatsData[selectedCoachType][curr],
          ],
          [].toSorted((a, b) => {
            if (sortAscending) {
              if (a.to > b.to) {
                return 1;
              } else {
                return -1;
              }
            } else if (!sortAscending) {
              if (b.to > a.to) {
                return 1;
              } else {
                return -1;
              }
            }
            return 0;
          }),
        ),
      });
    } else {
      updateTrainComposition({
        type: "seats_to_show",
        availableSeats: [
          ...fetchedSeatsData?.[selectedCoachType]?.[givenNumber],
        ].toSorted((a, b) => {
          if (sortAscending) {
            if (a.to > b.to) {
              return 1;
            } else {
              return -1;
            }
          } else if (!sortAscending) {
            if (b.to > a.to) {
              return 1;
            } else {
              return -1;
            }
          }
          return 0;
        }),
      });
    }
  };

  const ReviewModal = () => {
    return (
      <div
        className="review-background"
        style={{ display: showReviewModal ? "block" : "none" }}
      >
        <div className="review-modal">
          <div className="title"> Enjoying Comfort Jouney? </div>
          <div className="text-message">
            {" "}
            If you are liking the experience here, kindly rate us on
            playstore{" "}
          </div>
          <div className="btn-container">
            {" "}
            <button onClick={() => setShowReviewModal(false)}>
              {" "}
              <a
                href="https://play.google.com/store/apps/details?id=app.comfortjourney.android&hl=en_US"
                target="_blank"
                rel="noopener noreferrer"
              >
                {" "}
                Rate Now{" "}
              </a>{" "}
            </button>{" "}
            <button onClick={() => setShowReviewModal(false)}>
              {" "}
              Maybe Later{" "}
            </button>{" "}
          </div>
        </div>
      </div>
    );
  };

  const handleSortTypeChange = (type) => {
    setSortType(type);
    const sorted = [...seatsToShow].sort((a, b) => {
      if (type === "seatNumber") {
        const aNum = parseInt(a.berthNumber) || 0;
        const bNum = parseInt(b.berthNumber) || 0;
        return sortAscending ? aNum - bNum : bNum - aNum;
      } else if (type === "distance") {
        const aToIdx = routeData.findIndex((s) => s.source_stn_code === a.to);
        const bToIdx = routeData.findIndex((s) => s.source_stn_code === b.to);
        return sortAscending ? aToIdx - bToIdx : bToIdx - aToIdx;
      }
      return 0;
    });
    updateTrainComposition({ type: "seats_to_show", availableSeats: sorted });
  };

  const handleToggle = () => {
    setSortAscending((value) => !value);
    const sorted = [...seatsToShow].sort((a, b) => {
      if (sortType === "seatNumber") {
        const aNum = parseInt(a.berthNumber) || 0;
        const bNum = parseInt(b.berthNumber) || 0;
        return !sortAscending ? aNum - bNum : bNum - aNum;
      } else if (sortType === "distance") {
        const aToIdx = routeData.findIndex((s) => s.source_stn_code === a.to);
        const bToIdx = routeData.findIndex((s) => s.source_stn_code === b.to);
        return !sortAscending ? aToIdx - bToIdx : bToIdx - aToIdx;
      }
      return 0;
    });
    updateTrainComposition({ type: "seats_to_show", availableSeats: sorted });
  };

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    fetchRoute();
    fetchTrainComposition();
    setTimeout(() => setShowReviewModal(true), 25000);
  }, []);

  // Compute seat recommendations when we have seats data for selected coach
  useEffect(() => {
    if (
      selectedCoachType &&
      fetchedSeatsData[selectedCoachType] &&
      routeData.length > 0 &&
      toStationCodeFromURL
    ) {
      // Get seats only from the selected coach type
      const coachSeats = Object.values(
        fetchedSeatsData[selectedCoachType],
      ).flat();

      if (coachSeats.length > 0) {
        const recs = findBestSeatCombinations(
          coachSeats,
          fromSTN,
          toStationCodeFromURL,
          routeData,
        );
        if (recs.length > 0) {
          updateTrainComposition({
            type: "recommendations",
            recommendations: recs,
          });
        } else {
          updateTrainComposition({
            type: "recommendations",
            recommendations: [],
          });
        }
      }
    }
  /* eslint-disable react-hooks/exhaustive-deps */
  }, [selectedCoachType, fetchedSeatsData, routeData, toStationCodeFromURL]);

  return (
    <div className="train-coach-details">
      <ReturnHome />
      <ReviewModal />
      <ShareBtn />
      {isLoading && <Loader />}

      <h1>
        {trainNumber} - {trainName}
      </h1>

      {/* Route Visualization */}
      {routeData?.length > 0 && (
        <div className="route-visualization">
          <div
            className="route-header"
            onClick={() => setRouteOpen(!routeOpen)}
          >
            <h3>Train Route ({routeData.length} stops)</h3>
            <span className={`route-toggle ${routeOpen ? "open" : ""}`}>▼</span>
          </div>
          {routeOpen && (
            <div className="route-stations">
              {routeData.map((station, index) => {
                const isBoarding = station.source_stn_code === fromSTN;
                const isDestination = index === routeData.length - 1;
                const isAfterBoarding =
                  routeData.findIndex((s) => s.source_stn_code === fromSTN) <
                  index;

                return (
                  <div
                    key={index}
                    className={`route-station ${isBoarding ? "boarding" : ""} ${isDestination ? "destination" : ""} ${isAfterBoarding ? "after-boarding" : ""}`}
                  >
                    <div className="station-dot"></div>
                    <div className="station-info">
                      <span className="station-code">
                        {station.source_stn_code}
                      </span>
                      <span className="station-name">
                        {station.source_stn_name}
                      </span>
                      {station.arrive !== "First" &&
                        station.arrive !== "Last" && (
                          <span className="station-time">{station.arrive}</span>
                        )}
                      {isBoarding && (
                        <span className="station-badge">BOARDING</span>
                      )}
                      {isDestination && (
                        <span className="station-badge">DESTINATION</span>
                      )}
                    </div>
                    {index < routeData.length - 1 && (
                      <div className="station-connector"></div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Seat Recommendations */}
      {seatRecommendations?.length > 0 && (
        <div className="recommendations-section">
          <div className="route-header" onClick={() => setRecsOpen(!recsOpen)}>
            <h3>
              Recommended Seats ({fromSTN} → {toStationCodeFromURL || "Destination"})
            </h3>
            <span className={`route-toggle ${recsOpen ? "open" : ""}`}>▼</span>
          </div>
          {recsOpen && (
            <div className="rec-flow">
              {seatRecommendations.map((rec, recIndex) => (
                <div
                  key={recIndex}
                  className={`recommendation-card ${rec.type === "single" ? "direct" : "multi"}`}
                >
                  <p
                    className="rec-description"
                    style={{ marginBottom: ".5rem" }}
                  >
                    {rec.description}
                  </p>
                  <ol className="rec-steps">
                    {rec.seats.map((seat, seatIdx) => (
                      <li key={seatIdx} className="rec-step">
                        <div className="step-badge">
                          {String.fromCharCode(65 + seatIdx)}
                        </div>
                        <div className="step-body">
                          <div className="seat-line">
                            {seat.coach} · Seat {seat.berth}
                          </div>
                          <div className="seat-sub">{seat.berthType}</div>
                          <div className="route-line">
                            {seat.coverage || `${seat.from} → ${seat.to}`}
                          </div>
                        </div>
                        {seatIdx < rec.seats.length - 1 && (
                          <div className="step-arrow">→</div>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* <h3> Journey Date:  {jDate} </h3> */}

      {trainCoachType?.length !== 0 && <h2> Please Select Coach Type </h2>}

      {trainCoachType?.map((coachType, index) => (
        <button
          key={index}
          className={`choice-btn ${coachType === selectedCoachType && "choice-btn-active"}`}
          onClick={() => handleCoachTypeChoice(coachType)}
        >
          {" "}
          {coachType}{" "}
        </button>
      ))}

      {filteredCoachList?.length !== 0 && <h2> Please Select Coach Number </h2>}

      <div className="filtered-coach">
        {filteredCoachList?.map(({ coachName }, index) => (
          <button
            key={index}
            className={`choice-btn ${coachName === selectedCoachNumber && "choice-btn-active"} `}
            onClick={() => handleCoachNumberChoice(coachName)}
          >
            {" "}
            {coachName}{" "}
            <span className="seats-count">
              {"(" +
                (fetchedSeatsData?.[selectedCoachType]?.[coachName]?.length ??
                  0) +
                ")"}{" "}
            </span>{" "}
          </button>
        ))}

        {selectedCoachType.trim().length !== 0 && (
          <button
            className={`choice-btn ${selectedCoachNumber === "All" && "choice-btn-active"} `}
            onClick={() => handleCoachNumberChoice("All")}
          >
            {" "}
            Show All{" "}
            <span className="seats-count">
              {"(" +
                (Object.keys(fetchedSeatsData)?.includes(selectedCoachType)
                  ? fetchTotal()
                  : 0) +
                ")"}{" "}
            </span>{" "}
          </button>
        )}
      </div>

      {seatsToShow?.length !== 0 && <h2> Available Seats </h2>}

      {seatsToShow?.length !== 0 && (
        <div className="sort-container">
          <span>Sort By: </span>
          <button
            className={`sort-btn ${sortType === "seatNumber" ? "active" : ""}`}
            onClick={() => handleSortTypeChange("seatNumber")}
          >
            Seat #
          </button>
          <button
            className={`sort-btn ${sortType === "distance" ? "active" : ""}`}
            onClick={() => handleSortTypeChange("distance")}
          >
            Distance
          </button>
          <button className="sort-direction" onClick={handleToggle}>
            {sortAscending ? "↑ Asc" : "↓ Desc"}
          </button>
        </div>
      )}

      <ul className="available-seats">
        {seatsToShow?.map(
          ({ berthCode, berthNumber, from, to, coachName }, index) => (
            <li key={index}>
              {berthCode.trim().length === 0 ? (
                <p className="berth-number">
                  {" "}
                  {coachName} - {berthNumber}{" "}
                </p>
              ) : (
                <p className="berth-number">
                  {" "}
                  {coachName} : {berthNumber} - {GIVE_BERTH_NAME(berthCode)}
                </p>
              )}
              <p>
                {" "}
                <span className="train-sub-head"> From : </span> {from} ,{" "}
                <span className="train-sub-head"> To : </span> {to}{" "}
              </p>
            </li>
          ),
        )}

        {selectedCoachNumber?.length !== 0 && seatsToShow?.length === 0 && (
          <li style={{ padding: "0.5rem" }}>
            {" "}
            No available Seats,Kinldy Check other Stations/Coach .
          </li>
        )}
      </ul>
    </div>
  );
};
