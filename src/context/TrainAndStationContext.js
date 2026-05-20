import { useEffect, useContext, createContext, useReducer } from "react";
import { useNavigate } from "react-router-dom";

const TrainAndStationContext = createContext();

const navigate  = path => {
    const nav = useNavigate;
    nav(path);
}

const generateDate = () => {
    const yyyy = new Date().getFullYear();
    const tempMonth = new Date().getMonth()+1;
    const mm = tempMonth.toString().length===1 ? '0'+tempMonth : tempMonth
   const tempDate = new Date().getDate();
    const dd = tempDate.toString().length===1 ? '0'+tempDate : tempDate;
    return ({ dd, mm, yyyy })
}

const updateTrainsAndStationData = ( data, action ) => {
    switch(action.type){
        case 'addTrains' : return ({ ...data, trainList: action.payload, trainListToDisplay: action.payload });

        case 'choiceClick' : return ({ ...data, selectedTrainNo: action.train_no, trainSearchText: action.train_name.trim(), trainListStyle: { display: 'none' } });

        case 'searchText' : return ({ ...data, trainSearchText: action.payload, trainListToDisplay: data.trainList.filter( train => train.toLowerCase().includes( action.payload.toLowerCase() ) )});

        case 'onFocus' : return ({ ...data, trainListStyle: { display: 'block' }, trainListToDisplay: data.trainList.filter( train => train.toLowerCase().includes( data.trainSearchText.toLowerCase() ) ), fromStationStyle: { display: 'none' }, toStationStyle: { display: 'none' } });

        case 'onBlur' : return ({ ...data, trainListStyle: { display: 'none' } });

        case 'addStations' : return ({ ...data, stationList: action.payload, fromStationListToDisplay: action.payload, toStationListToDisplay: action.payload });

        case 'fromStationChoice' : return ({ ...data, fromStationCode: action.station_code, fromStationText: action.station_name.trim(), fromStationStyle: { display: 'none' }  });

        case 'toStationChoice' : return ({ ...data, toStationCode: action.station_code, toStationText: action.station_name.trim(),  toStationStyle: { display: 'none' } });

        case 'fromStationSearch' : return ({ ...data, fromStationText: action.value, fromStationListToDisplay: data.stationList.filter( station => station.toLowerCase().includes( action.value.toLowerCase() ) ), toStationStyle: { display: 'none' } });

        case 'toStationSearch' : return ({ ...data, toStationText: action.value, toStationListToDisplay: data.stationList.filter( station => station.toLowerCase().includes( action.value.toLowerCase() ) ), fromStationStyle: { display: 'none' } });

        case 'fromStationFocus' : return ({ ...data, fromStationStyle: { display: 'block' }, trainListStyle: { display: 'none' }, fromStationListToDisplay: data.stationList.filter( station => station.toLowerCase().includes( data.fromStationText.toLowerCase() ) ), toStationStyle: { display: 'none' } });

        case 'toStationFocus' : return ({ ...data, toStationStyle: { display: 'block' }, trainListStyle: { display: 'none' }, toStationListToDisplay: data.stationList.filter( station => station.toLowerCase().includes( data.toStationText.toLowerCase() ) ), fromStationStyle: { display: 'none' } });

        case 'interchange' : return ({ ...data, toStationText: data.fromStationText, fromStationText:data.toStationText });

        // case 'addJdate' : return({...data, jDate: action.jdate });
        case 'add-date' : return ({ ...data,  jDate: action.payload});

        case 'show-vacant' : return ({ ...data,  showAllVacant: action.payload});
        
        default: navigate('/error');
    }
}


export const TrainAndStationProvider = ({children}) => {

    const navigate = useNavigate();
    const { dd, mm, yyyy } = generateDate();

    const [ trainsAndStationData, setTrainsAndStationData ] = useReducer( updateTrainsAndStationData, { stationList: [], fromStationListToDisplay: [], toStationListToDisplay: [], fromStationText: '', toStationText: '', fromStationCode: '', toStationCode: '', fromStationStyle: { display: 'none' }, toStationStyle: { display: 'none' }, trainList: [], trainListToDisplay: [], trainSearchText: '', selectedTrainNo: '',trainListStyle: { display: 'none' }, jDate: `${yyyy}-${mm}-${dd}`, showAllVacant: false } );

    const updateTrainList = list => setTrainsAndStationData({ type: 'addTrains', payload: list });

    const handleTrainChoice = e => setTrainsAndStationData({ type: 'choiceClick', train_no: e.target.value, train_name: e.target.textContent }); 

    const handleTrainSearch = e => setTrainsAndStationData({ type: 'searchText', payload: e.target.value });

    const handleTrainBlur = () => setTrainsAndStationData({ type: 'onBlur' });

    const handleTrainFocus = () => setTrainsAndStationData({ type: 'onFocus' })

    const updateStationList = list => setTrainsAndStationData({ type: 'addStations', payload: list });

    const handleFromStationChoice = e => setTrainsAndStationData({ type: 'fromStationChoice', station_name: e.target.textContent, station_code: e.target.textContent.split('-')[1].trim()})
    
    const handleToStationChoice = e => setTrainsAndStationData({ type: 'toStationChoice', station_name: e.target.textContent, station_code: e.target.textContent.split('-')[1].trim()})

    const handleFromStationSearch = e => setTrainsAndStationData({ type: 'fromStationSearch', value: e.target.value })

    const handleToStationSearch = e => setTrainsAndStationData({ type: 'toStationSearch', value: e.target.value })

    const handleFromStationFocus = () => setTrainsAndStationData({ type: 'fromStationFocus' })

    const handleToStationFocus = () => setTrainsAndStationData({ type: 'toStationFocus' })

    const handleInterChange = () => setTrainsAndStationData({ type: 'interchange' });

    const handleShowAllVacant = value => setTrainsAndStationData({ type: 'show-vacant', payload: value })

    const handleJdate = date => {
        console.log('handle triggered', date, typeof(date))
        setTrainsAndStationData({ type: 'add-date', payload: date });
    }

    const fetchStations = async() => {
        try{
        const response = await fetch('https://www.irctc.co.in/eticketing/StationLinguisticNames');
        const stationsText = await response.text();
        updateStationList(stationsText.split('=')[1].replace(';','').replace(']','').replace('[','').replaceAll('"','').split(','));
        }
        catch(eror){
            navigate('/error');
        }
    }

    const fetchTrains = async() => {
        try{
        const response = await fetch('https://www.irctc.co.in/eticketing/trainList', { method:'GET' });
        const trainText = await response.text();
         updateTrainList(trainText.replaceAll('"','').split(','));
        }
        catch(eror){
           navigate('/error');
        }
    }

    useEffect( ()=>{
        fetchStations();
        fetchTrains();
    },[] )

    return <TrainAndStationContext.Provider value={{ handleTrainBlur, handleTrainChoice, handleTrainFocus, handleTrainSearch, trainsAndStationData , handleFromStationChoice, handleToStationChoice, handleFromStationFocus, handleToStationFocus, handleFromStationSearch, handleToStationSearch, handleInterChange, handleJdate, handleShowAllVacant}} >
        {children}
    </TrainAndStationContext.Provider>
}

export const useTrainAndStation = () => useContext(TrainAndStationContext);