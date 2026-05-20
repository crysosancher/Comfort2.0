import shareSvg from './share-icon.svg';

export const ShareBtn = () => {

    const handleShare = () => {
        navigator.clipboard.writeText('https://play.google.com/store/apps/details?id=app.comfortjourney.android&hl=en_US');
        alert('URL Copied To ClipBoard');
    }

    return <div className='share-btn' onClick={handleShare} title='Share' >
        <img src={shareSvg} />
    </div>
}
