import './stylesheets/card.css'

const Card = ({ heading, body, img, inverted }) => {
    console.log('url(' + img + ')')
    return (<>

        {inverted ?
            <div className='card'>
                <img src={img} alt="" />
                <div className='cardContent'>
                    <h1 style={{alignSelf: 'flex-end'}}>{heading}</h1>
                    <p>{body}</p>
                </div>
            </div>
            :
            <div className='card'>
                <div className='cardContent'>
                    <h1>{heading}</h1>
                    <p>{body}</p>
                </div>
                <img src={img} alt="" />
            </div>
        }

    </>
    );
};

export default Card;