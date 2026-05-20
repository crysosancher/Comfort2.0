import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTrainAndStation } from "..";

import axios from "axios";

import { ReturnHome } from "./ReturnHome";
import { Loader } from "./Loader";
import { ShareBtn } from "./ShareIcon";

export const TrainBetweenStations = () => {
  const navigate = useNavigate();
  const { stationNames } = useParams();
  const [trainList, setTrainList] = useState([]);
  const [noTrains, setnoTrains] = useState("");
  const [isLoadig, setLoading] = useState(false);

  const [fromStnName, toStnName] = stationNames.split("&");
  const [fromStationCode, toStationCode] = stationNames
    .split("&")
    .map((stn) => stn.split("-")[1].trim());

  const {
    trainsAndStationData: { jDate },
    handleShowAllVacant,
  } = useTrainAndStation();

  const currHour = new Date().getHours();
  const currMins = new Date().getMinutes();

  const checkTime = (trainTime) => {
    return Number(trainTime) >= Number(`${currHour}.${currMins}`);
  };

  const availableTrains = trainList
    ?.filter(({ train_base: { from_time } }) => checkTime(from_time))
    .toSorted((a, b) => a.train_base.from_time - b.train_base.from_time);

  const fetchTrainsBetweenStations = async () => {
    setLoading(true);
    try {
        //https://little-katlin-crysosancher-e5eb62fd.koyeb.app/trains/gettrainon?from=NDLS&to=HWH&date=2024-06-07
        //https://tiny-genny-crysosancher-8c9bde69.koyeb.app/station-details?fromStation=${fromStationCode}?toStation=${toStationCode}?date=${jDate}
      const res = await fetch(
        `https://little-katlin-crysosancher-e5eb62fd.koyeb.app/trains/gettrainon?from=${fromStationCode}&to=${toStationCode}&date=${jDate}`
      );
      const json = await res.json();
      if (json.success) {
        setTrainList(json.data);
      } else {
        setnoTrains(json.data);
      }
    } catch (eror) {
      navigate("/error");
    } finally {
      setLoading(false);
    }
  };

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    fetchTrainsBetweenStations();
  }, []);

  const calcTrainDays = (binary) => {
    const WEEK_DAYS = ["S", "M", "T", "W", "T", "F", "S"];
    const daysArray = binary.split("");
    const sundayValue = daysArray.pop();
    daysArray.unshift(sundayValue);

    return (
      <>
        {daysArray?.map((day, index) => (
          <span
            key={index}
            style={{ color: Number(day) === 0 ? "gray" : "green" }}
            className="train-days"
          >
            {" "}
            {WEEK_DAYS[index]}{" "}
          </span>
        ))}
      </>
    );
  };

  const findSeatsHandler = async (trainNumber, fromSTN, trainName) => {
    setLoading(true);
    try {
      const res = await axios.post(
        "https://www.irctc.co.in/online-charts/api/trainComposition",
        { boardingStation: fromSTN, jDate: jDate, trainNo: trainNumber }
      );
      if (res.data.cdd) {
        handleShowAllVacant(false);
        navigate(`/trains/${trainNumber}-${trainName}from${fromSTN}`);
      } else {
        alert(res.data.error);
      }
    } catch (eror) {
      navigate("/error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="train-btwn-stn-container">
      <ReturnHome />
      <ShareBtn />
      <h1> From: {fromStnName} </h1>
      <h1> To: {toStnName} </h1>
      {/* <h3> Journey Date: {jDate} </h3> */}
      {isLoadig && <Loader />}
      <section className="trains-section">
        {availableTrains?.map(
          (
            {
              train_base: {
                train_no,
                train_name,
                from_stn_name,
                from_stn_code,
                to_stn_name,
                to_stn_code,
                from_time,
                to_time,
                running_days,
              },
            },
            index
          ) => {
            if (checkTime(from_time)) {
              return (
                <div key={index} className="train-container">
                  <h2>
                    {train_no} : {train_name}{" "}
                  </h2>
                  <div className="train-details">
                    <p>
                      {" "}
                      <span className="train-sub-head">From : </span>{" "}
                      {from_stn_name}-{from_stn_code}:{" "}
                      <span className="train-sub-head"> {from_time} </span>{" "}
                    </p>
                    <p>
                      {" "}
                      <span className="train-sub-head">To : </span>{" "}
                      {to_stn_name}-{to_stn_code}:{" "}
                      <span className="train-sub-head"> {to_time} </span>{" "}
                    </p>
                    <p className="running-days">
                      {" "}
                      Runs on Days : {calcTrainDays(running_days)}{" "}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      findSeatsHandler(train_no, from_stn_code, train_name)
                    }
                  >
                    {" "}
                    Find Seats{" "}
                  </button>
                </div>
              );
            }
            return null;
          }
        )}
      </section>
      {!isLoadig && noTrains !== "" && (
        <>
          <h2 className="border">
            {" "}
            Oops... {noTrains} <br /> Kindly Search with direct train
            number/search from next station{" "}
          </h2>
          <Link to="/">
            {" "}
            <button className="secondary-go-home">
              {" "}
              Find Alternate Routes{" "}
            </button>{" "}
          </Link>
        </>
      )}
      {!isLoadig && availableTrains?.length === 0 && noTrains === "" && (
        <>
          <h2 className="border">
            {" "}
            Oopss... no train found after {currHour} : {currMins} <br /> Kindly
            Search with direct train number/search from next station{" "}
          </h2>
          <Link to="/">
            {" "}
            <button className="secondary-go-home">
              {" "}
              Search Next Station{" "}
            </button>{" "}
          </Link>
        </>
      )}
    </div>
  );
};
