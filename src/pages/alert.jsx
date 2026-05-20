export const AlertPop = () => {
  return (
    <div>
      <label>
        <input type="checkbox" className="alertCheckbox" autoComplete="off" />
        <div className="alert error">
          <span className="alertClose">X</span>
          <span className="alertText">
            Comfort Journey is on Maintenance. Please check back later.
            <br className="clear" />
          </span>
        </div>
      </label>
    </div>
  );
}
