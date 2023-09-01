const NotFound: React.FC = () => {
  return (
    <>
      <div style={{display: "flex", height: "100%"}}>
        <link
          href="https://maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css"
          rel="stylesheet"
        />
        <div className="page-404">
          <div className="outer">
            <div className="middle">
              <div className="inner">
                <div className="inner-circle">
                  <i className="fa fa-home"></i>
                  <span>404</span>
                </div>
                <span className="inner-status">Oops! You're lost</span>
                <span className="inner-detail">
                  We can not find the page you're looking for.
                </span>
                <a href="/Home" className="btn btn-info mtl">
                    <i className="fa fa-home"></i>&nbsp; Return home
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;
