import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";

import dArrow from "./dArrow.svg";
import uArrow from "./uArrow.svg";
import logo from "../data/logo.svg";
import { Loader } from "./Loader";
import { useTrainAndStation } from "..";
import { ChoiceOption } from "../components/ChoiceBox";
import { ShareBtn } from "./ShareIcon";
import { AlertPop } from "./alert";

const generateDate = () => {
  const yyyy = new Date().getFullYear();
  const tempMonth = new Date().getMonth() + 1;
  const mm = tempMonth.toString().length === 1 ? "0" + tempMonth : tempMonth;
  const tempDate = new Date().getDate();
  const dd = tempDate.toString().length === 1 ? "0" + tempDate : tempDate;
  return { dd, mm, yyyy };
};
// create a previousDate and nextDate function which will return the corresponding dates for example input {dd: 01, mm:12, yyyy:2023}
//@@ Crysosancher

function formatDate(date) {
  var dd = String(date.getDate()).padStart(2, "0");
  var mm = String(date.getMonth() + 1).padStart(2, "0"); // January is 0!
  var yyyy = date.getFullYear();

  return dd + " " + mm + " " + yyyy;
}

const previousDate = () => {
    var today = new Date();
    var nextDay = new Date(today);
    nextDay.setDate(today.getDate() - 1);
    var formattedNextDay = formatDate(nextDay);
    let dd = formattedNextDay.split(" ")[0];
    let mm = formattedNextDay.split(" ")[1];
    let yyyy = formattedNextDay.split(" ")[2];
    return { dd, mm, yyyy };
};

const nextDate = () => {
    var today = new Date();
    var nextDay = new Date(today);
    nextDay.setDate(today.getDate() + 1);
    var formattedNextDay = formatDate(nextDay);
    let dd = formattedNextDay.split(" ")[0];
    let mm = formattedNextDay.split(" ")[1];
    let yyyy = formattedNextDay.split(" ")[2];
    return { dd, mm, yyyy };
};

const { dd: nextDD, mm: nextMM, yyyy: nextYYYY } = nextDate();
const { dd: preDD, mm: preMM, yyyy: preYYYY } = previousDate();
//!! Use case sample after understanding remove it
/* Use case sample
async function main() {
  const date1 = { dd: 01, mm: 02, yyyy: 2020 };
  const date2 = { dd: 1, mm: 3, yyyy: 2020 };
  const date3 = { dd: 1, mm: 1, yyyy: 2020 };
  const date4 = { dd: 1, mm: 3, yyyy: 2021 };

  const previousDate1 = await previousDate(date1);
  const previousDate2 = await previousDate(date2);
  const previousDate3 = await previousDate(date3);
  const previousDate4 = await previousDate(date4);

  const nextDate1 = await nextDate(date1);
  const nextDate2 = await nextDate(date2);
  const nextDate3 = await nextDate(date3);
  const nextDate4 = await nextDate(date4);

  console.log(previousDate1); // Output: { dd: 31, mm: 1, yyyy: 2020 }
  console.log(previousDate2); // Output: { dd: 29, mm: 2, yyyy: 2020 } (leap year)
  console.log(previousDate3); // Output: { dd: 31, mm: 12, yyyy: 2019 }
  console.log(previousDate4); // Output: { dd: 28, mm: 2, yyyy: 2021 } (not a leap year)

  console.log(nextDate1); // Output: { dd: 2, mm: 2, yyyy: 2020 }
  console.log(nextDate2); // Output: { dd: 2, mm: 3, yyyy: 2020 }
  console.log(nextDate3); // Output: { dd: 2, mm: 1, yyyy: 2020 }
  console.log(nextDate4); // Output: { dd: 2, mm: 3, yyyy: 2021 }
}

main();

 */
export const Home = () => {
  const navigate = useNavigate();
  const [isLoadig, setLoading] = useState(false);
  const { dd, mm, yyyy } = generateDate();

  const {
    trainsAndStationData: {
      trainListToDisplay,
      trainSearchText,
      trainListStyle,
      selectedTrainNo,
    },
    handleTrainChoice,
    handleTrainSearch,
    handleTrainFocus,
  } = useTrainAndStation();
  const {
    trainsAndStationData: {
      fromStationListToDisplay,
      toStationListToDisplay,
      toStationText,
      fromStationText,
      fromStationStyle,
      toStationStyle,
      jDate,
    },
    handleFromStationChoice,
    handleToStationChoice,
    handleFromStationFocus,
    handleToStationFocus,
    handleFromStationSearch,
    handleToStationSearch,
    handleInterChange,
    handleJdate,
    handleShowAllVacant,
  } = useTrainAndStation();

  const fetchAndRedirect = async (trainNumber) => {
    if (trainNumber === "") {
      alert("Comfort-journey Says : please select valid Train");
    } else {
      setLoading(true);
      try {
        const trainInfo = await axios(
          `https://little-katlin-crysosancher-e5eb62fd.koyeb.app/trains/getTrain/?trainNo=${trainNumber}`
        );

        try {
          const res = await axios.post(
            "https://www.irctc.co.in/online-charts/api/trainComposition",
            {
              boardingStation: trainInfo.data.data.from_stn_code,
              jDate: jDate,
              trainNo: trainNumber,
            }
          );
          if (res.data.cdd) {
            handleShowAllVacant(true);
            navigate(
              `/trains/${trainSearchText.replace(" ", "")}from${
                trainInfo.data.data.from_stn_code
              }`
            );
          } else {
            alert(res.data.error);
          }
        } catch (eror) {
          navigate("/error");
        }
        // navigate(`/trains/${trainSearchText.replace(' ','')}from${trainInfo.data.data.from_stn_code}`);
      } catch (eror) {
        navigate("/error");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFindTrains = () => {
    if (fromStationText === toStationText) {
      alert("Comfort Journey Says: Stations name cant be same");
    } else {
      fromStationText.trim() === "" || toStationText.trim() === ""
        ? alert("Comfort-journey says: Please select Valid Stations")
        : navigate(`/trains-between/${fromStationText}&${toStationText}`);
    }
  };

  console.log(jDate);

  return (
    <main>
      {/* <AlertPop /> */}
      <ShareBtn />
      {isLoadig && <Loader />}
      <img src={logo} alt="comfort journey logo" />
      <div>
        <h2> Train Starts : </h2>
        <div className="date-btn-container">
          <button
            className="date-btn"
            style={
              jDate === `${preYYYY}-${preMM}-${preDD}`
                ? { backgroundColor: "#2B4577" }
                : {
                    backgroundColor: "white",
                    color: "currentColor",
                    border: "1px solid currentColor",
                  }
            }
            onClick={() => handleJdate(`${preYYYY}-${preMM}-${preDD}`)}
          >
            {" "}
            Yesterday{" "}
          </button>
          <button
            className="date-btn"
            style={
              jDate === `${yyyy}-${mm}-${dd}`
                ? { backgroundColor: "#2B4577" }
                : {
                    backgroundColor: "white",
                    color: "currentColor",
                    border: "1px solid currentColor",
                  }
            }
            onClick={() => handleJdate(`${yyyy}-${mm}-${dd}`)}
          >
            {" "}
            Today{" "}
          </button>
          <button
            className="date-btn"
            style={
              jDate === `${nextYYYY}-${nextMM}-${nextDD}`
                ? { backgroundColor: "#2B4577" }
                : {
                    backgroundColor: "white",
                    color: "currentColor",
                    border: "1px solid currentColor",
                  }
            }
            onClick={() => handleJdate(`${nextYYYY}-${nextMM}-${nextDD}`)}
          >
            {" "}
            Tomorrow{" "}
          </button>
        </div>
      </div>
      <h1> Enter Station Name </h1>
      <section className="input-section">
        <input
          type="text"
          value={fromStationText}
          onChange={handleFromStationSearch}
          onFocus={handleFromStationFocus}
          placeholder="From"
        />
        <ul style={fromStationStyle} className="from-choice">
          {fromStationListToDisplay?.slice(0, 20).map((station, index) => {
            const data = station.split("-")[1].trim();
            return (
              <ChoiceOption
                key={index}
                choiceDetails={station}
                clickHandler={handleFromStationChoice}
                choiceValue={data}
              />
            );
          })}
        </ul>
      </section>

      <section className="interchange-section">
        <button className="btn-interchange" onClick={handleInterChange}>
          <img className="arrow-down" src={dArrow} alt="interchange btn" />
          <img className="arrow-up" src={uArrow} alt="interchange btn" />
        </button>
      </section>

      <section className="input-section">
        <input
          type="text"
          value={toStationText}
          onChange={handleToStationSearch}
          onFocus={handleToStationFocus}
          placeholder="To"
        />
        <ul style={toStationStyle} className="to-choice">
          {toStationListToDisplay?.slice(0, 20).map((station, index) => (
            <ChoiceOption
              key={index}
              choiceDetails={station}
              clickHandler={handleToStationChoice}
              choiceValue={station.split("-")[1]}
            />
          ))}
        </ul>
      </section>

      <button className="action-btn" onClick={handleFindTrains}>
        {" "}
        Find Trains{" "}
      </button>

      <section className="or-section">
        <span></span>
        <span>OR</span>
        <span></span>
      </section>

      <section className="input-section">
        <input
          type="text"
          value={trainSearchText}
          onChange={handleTrainSearch}
          onFocus={handleTrainFocus}
          placeholder="Train No."
        />

        <ul style={trainListStyle} className="train-choice">
          {trainListToDisplay?.slice(0, 20).map((train, index) => (
            <ChoiceOption
              key={index}
              choiceDetails={train}
              clickHandler={handleTrainChoice}
              choiceValue={train.split("-")[0]}
            />
          ))}
        </ul>
      </section>
      <button
        className="action-btn"
        onClick={() => fetchAndRedirect(selectedTrainNo)}
      >
        {" "}
        Find Seats{" "}
      </button>
    </main>
  );
};
