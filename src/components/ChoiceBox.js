
export const ChoiceOption = ({ choiceValue, choiceDetails, clickHandler }) => {
    // console.log(choiceValue)
    return <li value={choiceValue} onClick={clickHandler} > {choiceDetails} </li>
}

