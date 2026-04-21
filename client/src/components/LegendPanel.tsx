export const LegendPanel = (): JSX.Element => {
  return (
    <section className="panel panel-legend">
      <div className="panel-heading">
        <h2>Legend</h2>
      </div>
      <div className="legend-list">
        <label className="legend-item">
          <span className="sketch-box sketch-box-red" />
          <span>Alpha Team</span>
        </label>
        <label className="legend-item">
          <span className="sketch-box sketch-box-blue" />
          <span>Bravo Team</span>
        </label>
        <label className="legend-item">
          <span className="sketch-box sketch-box-zone" />
          <span>Control Zone</span>
        </label>
      </div>
    </section>
  );
};
