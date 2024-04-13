import './stylesheets/card.css'

// Cards have fixed image width and will adjust height as required while not skewing aspect ratio

const Card = ({ heading, body, img, inverted }) => {
    return (<>
        {inverted ?
            <div className='card'>
                {img? <img src={img} alt="" /> : null}
                <div className='cardContent'>
                    <h1 id='mainLabel'style={{alignSelf: 'flex-end'}}>{heading}</h1>
                    {body}
                </div>
            </div>
            :
            <div className='card'>
                <div className='cardContent'>
                    <h1 id='mainLabel'>{heading}</h1>
                    {body}
                </div>
                {img? <img src={img} alt="" /> : null}
            </div>
        }
    </>
    );
};

export default Card;