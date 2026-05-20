import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useReducer, useState } from 'react';
import axios from 'axios';
import ToggleButton from 'react-toggle-button'

import { ReturnHome } from './ReturnHome';
import { Loader } from './Loader';
import { ShareBtn } from './ShareIcon';
import { useTrainAndStation } from "..";

const handleTrains = (data,action) => {
    switch(action.type){
        case 'addData' : return({ ...data, allData: action.data, trainCoachType: action.coachTypeList });

        case 'coachChoice' : return({ ...data, selectedCoachType: action.coachType, filteredCoachList: data.allData.filter( ({classCode}) => classCode === action.coachType ), seatsToShow:[], selectedCoachNumber: '' });

        case 'fetched_seats_of_coachType': return ({ ...data, fetchedSeatsOfCoachType: [ ...data.fetchedSeatsOfCoachType, action.newCoach ], seatsToShow: [] });

        case 'fetched_seats_data' : return ({ ...data, fetchedSeatsData: { ...data.fetchedSeatsData, ...action.newSeats }, seatsToShow: [] });

        case 'coach_number' : return({ ...data, selectedCoachNumber: action.newCoachNumber });

        case 'seats_to_show' : return({ ...data, seatsToShow: action.availableSeats });

        default: throw Error( `SOme error occured in handlering train data, action type: ${action.type}` );
    }
}

const GIVE_BERTH_NAME = code => {
    switch(code){
        case 'W' : return 'Window';

        case 'S' : return 'Side';

        case 'L' : return 'Lower';

        case 'M' : return 'Middle';

        case 'U' : return 'Upper';

        case 'P' : return 'Side Upper';

        case 'R' : return 'Side Lower';

        default : return code;
    }
}

const beautifyData = obj => obj.reduce( (accu,curr) =>  Object.keys(accu).includes(curr.coachName) ? ({ ...accu, [curr.coachName]: [ ...accu[curr.coachName], curr ] }) : ({ ...accu, [curr.coachName]: [ curr ] }) , { } );

export const TrainDetails = () => {

    const navigate = useNavigate();
    const { trainNo } = useParams();
    const [ isLoading, setLoading ] = useState(false);
    const [ showReviewModal ,setShowReviewModal ] = useState(false);

    const { trainsAndStationData: { jDate, showAllVacant } } = useTrainAndStation();

    const [trainNumber, trainName,  fromSTN] = [...trainNo.split('from')[0].split('-'), trainNo.split('from')[1]]

    const [ { trainCoachType, filteredCoachList, selectedCoachType, fetchedSeatsOfCoachType, fetchedSeatsData, selectedCoachNumber, seatsToShow, }, updateTrainComposition ] = useReducer(handleTrains, ({ allData: [],  trainCoachType: [], selectedCoachType: '', filteredCoachList: [], coachComposition: [], fetchedSeatsOfCoachType: [], fetchedSeatsData: {}, selectedCoachNumber: '', seatsToShow: [] }));

    const setTrainsData = list => updateTrainComposition({ type: 'addData', data: list, coachTypeList: list?.reduce( (accu,{classCode}) =>  accu.includes(classCode)? accu: [...accu, classCode],[]) });

    const [sortAscending, setSortAscending] = useState(true);

    const fetchTrainComposition = async() => {
        setLoading(true);
        try{
            const res = await axios.post('https://www.irctc.co.in/online-charts/api/trainComposition', { boardingStation: fromSTN, jDate: jDate, trainNo: trainNumber})
            setTrainsData(res.data.cdd);
        }
        catch(eror){
            navigate('/error');
        }
        finally{
            setLoading(false);
        }
    }

    const handleCoachTypeChoice = async givenCoachType => {

        updateTrainComposition({ type: 'coachChoice', coachType: givenCoachType });

        if( !fetchedSeatsOfCoachType.includes(givenCoachType) ){
            setLoading(true);      
            try{
                //https://little-katlin-crysosancher-e5eb62fd.koyeb.app/trains/getTrain/?trainNo=12345
                //https://grumpy-leather-jacket-eel.cyclic.app/train?trainNo=${trainNumber}
                const trainInfo = await axios(`https://little-katlin-crysosancher-e5eb62fd.koyeb.app/trains/getTrain/?trainNo=${trainNumber}`);
                const res= await axios.post('https://www.irctc.co.in/online-charts/api/vacantBerth', { boardingStation : fromSTN, cls : givenCoachType , jDate : jDate, remoteStation : fromSTN, trainNo : trainNumber, trainSourceStation : trainInfo.data.data.from_stn_code, chartType: 2} )
                if(res.data.error===null ){
                    updateTrainComposition({ type: 'fetched_seats_of_coachType', newCoach: givenCoachType });
                    if(showAllVacant){
                        updateTrainComposition({ type: 'fetched_seats_data', newSeats: { [givenCoachType]: beautifyData(res.data.vbd)} });
                    }
                    else{
                        updateTrainComposition({ type: 'fetched_seats_data', newSeats: { [givenCoachType]: beautifyData(res.data.vbd.filter( ({from}) => from === fromSTN ) ) } });
                    }
                  
                }
                else{
                    const res= await axios.post('https://www.irctc.co.in/online-charts/api/vacantBerth', { boardingStation : fromSTN, cls : givenCoachType , jDate : jDate, remoteStation : fromSTN, trainNo : trainNumber, trainSourceStation : trainInfo.data.data.from_stn_code, chartType: 1} )
                    updateTrainComposition({ type: 'fetched_seats_of_coachType', newCoach: givenCoachType });
                    if(showAllVacant){
                        updateTrainComposition({ type: 'fetched_seats_data', newSeats: { [givenCoachType]: beautifyData(res.data.vbd)} });
                    }
                    else{
                        updateTrainComposition({ type: 'fetched_seats_data', newSeats: { [givenCoachType]: beautifyData(res.data.vbd.filter( ({from}) => from === fromSTN ) )} });
                    }
                }
            }
            catch(eror){
                navigate('/error');
            }
            finally{
                setLoading(false);
            }
        }
       
    }

  const fetchTotal = () => Object?.keys(fetchedSeatsData?.[selectedCoachType])?.reduce( (total,current) => total+ fetchedSeatsData[selectedCoachType][current].length ,0 );

    const handleCoachNumberChoice = givenNumber => {
        updateTrainComposition({ type:'coach_number', newCoachNumber: givenNumber });
        if( givenNumber==='All' ) {
            updateTrainComposition({ type: 'seats_to_show', availableSeats: Object.keys(fetchedSeatsData[selectedCoachType]).reduce( (accu,curr) => [...accu, ...fetchedSeatsData[selectedCoachType][curr]] ,[].toSorted( (a,b) => {
                if(sortAscending){
                    if(a.to> b.to){
                        return 1;
                    }
                    else{
                        return -1;
                    }
                }
                else if(!sortAscending) {
                    if(b.to > a.to){
                        return 1;
                    }
                    else{
                        return -1;
                    }
                }
            } ) ) });
        }
        else{
            updateTrainComposition({ type: 'seats_to_show', availableSeats: [ ...fetchedSeatsData?.[selectedCoachType]?.[givenNumber] ].toSorted( (a,b) => {
                if(sortAscending){
                    if(a.to> b.to){
                        return 1;
                    }
                    else{
                        return -1;
                    }
                }
                else if(!sortAscending) {
                    if(b.to > a.to){
                        return 1;
                    }
                    else{
                        return -1;
                    }
                }
            } ) });
        }
    }

    const ReviewModal = () => {
        return <div className='review-background' style={{ display: showReviewModal ? 'block' : 'none' }} >
            <div className='review-modal' >
                <div className='title' > Enjoying Comfort Jouney? </div>
                <div className='text-message' > If you are liking the experience here, kindly rate us on playstore </div>
                <div className='btn-container' > <button onClick={ () => setShowReviewModal(false) } > <a href='https://play.google.com/store/apps/details?id=app.comfortjourney.android&hl=en_US' target='_blank' > Rate Now </a> </button> <button onClick={ () => setShowReviewModal(false) } > Maybe Later </button> </div>
            </div>
        </div>
    }

    const handleToggle = () => {
        if(!sortAscending){
            updateTrainComposition({ type: 'seats_to_show', availableSeats: seatsToShow.toSorted( (a,b) => a.to > b.to ? 1 : -1 ) })
        }
        else{
            updateTrainComposition({ type: 'seats_to_show', availableSeats: seatsToShow.toSorted( (a,b) => b.to > a.to ? 1 : -1 ) })
        }
        setSortAscending( value => !value );
    }

    useEffect( () => {
        fetchTrainComposition();
        setTimeout( () => setShowReviewModal(true) , 25000 );
    } ,[] )
    
    return <div className='train-coach-details' >
            <ReturnHome/>
            <ReviewModal />
            <ShareBtn />
            { isLoading && <Loader/> }
            
        <h1>{trainNumber} - {trainName}</h1>
        {/* <h3> Journey Date:  {jDate} </h3> */}

        { trainCoachType?.length!==0 && <h2> Please Select Coach Type </h2> }

        {
            trainCoachType?.map( (coachType,index) => <button key={index} className={`choice-btn ${ coachType===selectedCoachType && 'choice-btn-active' }`} onClick={ () =>  handleCoachTypeChoice(coachType) } > {coachType} </button> )
        }

        { filteredCoachList?.length!==0 && <h2> Please Select Coach Number </h2> }

        <div className='filtered-coach' >
            {
                filteredCoachList?.map( ({coachName}, index) => <button key={index} className={`choice-btn ${ coachName===selectedCoachNumber && 'choice-btn-active' } `} onClick={ () => handleCoachNumberChoice(coachName)} > {coachName} <span className='seats-count' >{ '('+ (fetchedSeatsData?.[selectedCoachType]?.[coachName]?.length ?? 0) +')'} </span> </button> )
            }

            { selectedCoachType.trim().length!==0 && <button className={`choice-btn ${ selectedCoachNumber==='All' && 'choice-btn-active' } `} onClick={ () => handleCoachNumberChoice('All') } > Show All <span className='seats-count' >{ '('+ ( Object.keys(fetchedSeatsData)?.includes(selectedCoachType) ? fetchTotal() : 0 ) +')'} </span> </button> }
        </div>

        { seatsToShow?.length!==0 && <h2> Available Seats </h2> }

        {
            seatsToShow?.length!==0 && <div className='toggle-container' >
            Sort By  <ToggleButton value={sortAscending} onToggle={ handleToggle } activeLabel={<p> A - Z </p>} inactiveLabel={<p> Z - A </p>} /> 
          </div>
        }
         
    
        <ul className='available-seats' >

            {
                seatsToShow?.map( ({ berthCode, berthNumber, from, to, coachName },index) =>  <li key={index} > 
                { berthCode.trim().length===0 ?<p className='berth-number' > { coachName } - {berthNumber} </p>  : <p className='berth-number' > {coachName} : {berthNumber} - {GIVE_BERTH_NAME(berthCode) }</p> }
                    <p>  <span className='train-sub-head' > From : </span> {from} , <span className='train-sub-head'> To : </span> {to} </p>
                    </li> )
            }

            {
                (selectedCoachNumber?.length!==0 && seatsToShow?.length===0 )&& <li style={{ padding: '0.5rem' }}> No available Seats,Kinldy Check other Stations/Coach .</li>
            }
        </ul>   

    </div>
}
