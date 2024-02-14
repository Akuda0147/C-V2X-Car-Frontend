'use client';
import React, { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Navigation, Thumbs } from 'swiper/modules';
import { GoogleMap, useLoadScript, LoadScript, Marker } from '@react-google-maps/api';
import { io } from 'socket.io-client';
import { FaBell } from 'react-icons/fa';
import { FaXmark } from 'react-icons/fa6';
import { MdOutlineExitToApp } from 'react-icons/md';
import { useRouter } from 'next/navigation';
import './dashboardPage.css';
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import StreamVideo from '@/component/videoStreaming/videoStreaming';

export default function Home() {
	const [thumbsSwiper, setThumbsSwiper] = useState(null);
	const [date, setDate] = useState('');
	const [time, setTime] = useState('');
	const [isButtonVisible, setIsButtonVisible] = useState(true);
	const [isPopupVisible, setIsPopupVisible] = useState(false);
	const [isLocationUndefined, setIsLocationUndefined] = useState(false);
	const [isObjectDetectionOn, setIsObjectDetectionOn] = useState(false);
	const router = useRouter();

	// car info
	const [speed, setSpeed] = useState(0.0);
	const [unit, setUnit] = useState('');
	const [latitude, setLatitude] = useState(0.0);
	const [longitude, setLongitude] = useState(0.0);

	// rsu info
	const [recSpeed, setRecSpeed] = useState(0.0);
	const [rsuLatitude, setRsuLatitude] = useState(0.0);
	const [rsuLongitude, setRsuLongitude] = useState(0.0);

	const location = { lat: latitude, lng: longitude } as google.maps.LatLngLiteral;
	const rsuLocation = { lat: rsuLatitude, lng: rsuLongitude } as google.maps.LatLngLiteral;

	const handleSwiper = (swiper: any) => {
		setThumbsSwiper(swiper);
	};
	const [scriptsLoaded, setScriptsLoaded] = useState(false);

	useEffect(() => {
		const script1 = document.createElement('script');
		script1.src = 'https://muazkhan.com:9001/dist/RTCMultiConnection.min.js';
		script1.async = false; // Set to true if you want async loading

		const script2 = document.createElement('script');
		script2.src = 'https://muazkhan.com:9001/socket.io/socket.io.js';
		script2.async = false; // Set to true if you want async loading


		const script3 = document.createElement('script');
		script3.src = "https://www.webrtc-experiment.com/RecordRTC.js";		;
		script3.async = false; // Set to true if you want async loading
		
		const loadScripts = async () => {
			document.body.appendChild(script1);
			document.body.appendChild(script2);
			document.body.appendChild(script3);

			await new Promise((resolve) => {
				script1.onload = script2.onload = script3.onload = resolve;
			});

			setScriptsLoaded(true);
		};

		loadScripts();

		// Cleanup scripts on component unmount
		return () => {
			document.body.removeChild(script1);
			document.body.removeChild(script2);
			document.body.removeChild(script3);
		};
	}, []);

	const updateDateTime = () => {
		const currentDateTime = new Date();
		const day = currentDateTime.getDate().toString().padStart(2, '0');
		const month = currentDateTime.toLocaleString('en-US', { month: 'long' });
		const year = currentDateTime.getFullYear();

		setDate(`${day} ${month} ${year}`);
		setTime(
			currentDateTime.toLocaleString('en-US', {
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit',
				hour12: false,
			})
		);
	};

	useEffect(() => {
		updateDateTime();
		const intervalId = setInterval(updateDateTime, 1000);

		const socket = io(`http://localhost:5000`);
		socket.on('connect', () => {
			console.log('connect to backend');
		});
		socket.on('disconnect', () => {
			console.log('Disconnected from backend');
		});
		socket.on('car info', (message) => {
			console.log(message);
			setSpeed(message['velocity']);
			setUnit(message['unit']);
			setLatitude(message['latitude']);
			setLongitude(message['longitude']);
		});
		socket.on('rsu info', (message) => {
			console.log(message);
			setRecSpeed(message['recommend_speed']);
			setRsuLatitude(message['latitude']);
			setRsuLongitude(message['longitude']);
		});

		return () => clearInterval(intervalId);
	}, []);

	const handleEmergency = () => {
		setIsButtonVisible(!isButtonVisible);
	};

	const handleConfirmEmergency = () => {
		setIsButtonVisible(!isButtonVisible);
		console.log(latitude+' '+longitude);
		
		if (typeof latitude === 'undefined' || typeof longitude === 'undefined') {
			console.log('Sent emergency failed : latitude or longitude is undefined.');
			setIsLocationUndefined(true);
		}
		else{
			const socket = io(`http://localhost:8002`);
			socket.emit('emergency', {
				token: localStorage.getItem('token'),
				car_id: localStorage.getItem('car_id'),
				latitude: latitude,
				longitude: longitude,
			});
			console.log('An emergency has been sent.');
		}
		const audio = new Audio('/noti.mp3');
    	audio.play();
		setIsPopupVisible(true);

		setTimeout(() => {
			setIsPopupVisible(false);
			setIsLocationUndefined(false);
		}, 3000);
	};

	const handleCancleEmergency = () => {
		setIsButtonVisible(!isButtonVisible);
		console.log('An emergency has been cancle.');
	};

	const handleObjectDetection = () => {
		setIsObjectDetectionOn(!isObjectDetectionOn);
		console.log('Toggle Object Detection.');
	};

	const handleLogout = () => {
		localStorage.removeItem('token');
		localStorage.removeItem('role');
        localStorage.removeItem('car_id');
		console.log('Already Logout.');
		router.push('/login');
	};

	return (
		<div>
		<div className="home-background" />
		<div className="home-container">
			<div className="left-container">
				<div>
				<LoadScript googleMapsApiKey="MY_GOOGLE_MAPS_API_KEY">
						<GoogleMap
							mapContainerStyle={{width: 1071, height: 1002}}
							options={{ disableDefaultUI: true }}
							zoom={14}
							center={location}
						>
							<Marker
								icon={{url: '/car_pin.svg'}}
								position={location}
							/>
							<Marker
								icon={{url: '/rsu_pin.svg'}}
								position={rsuLocation}
							/>
						</GoogleMap>
				</LoadScript>
				</div>
			</div>
			
			<div className="right-container">
				{scriptsLoaded ? <div className="video-container">
					<div className='main-video-container'>
						<Swiper
							loop={true}
							spaceBetween={10}
							thumbs={{ swiper: thumbsSwiper }}
							modules={[FreeMode, Navigation, Thumbs]}
							className='mySwiper2'
						>
							<SwiperSlide>
							{/* <img src="/background.png" /> */}
								<StreamVideo 
								carID={`65ac9720191a85b6842de0ec`}
								camNumber={"65940703ce9bc3c043a77615"}
								sourceNumber={0}
								isShowObjectDetection={isObjectDetectionOn}
								isStream={true}/>
							</SwiperSlide>
								
							<SwiperSlide>
								<StreamVideo 
								carID={`65ac9720191a85b6842de0ec`}
								camNumber={"65b6ff827c8483c5c4a474a5"}
								sourceNumber={0}
								isShowObjectDetection={isObjectDetectionOn}
								isStream={true}/>
							</SwiperSlide>

							<SwiperSlide>
								<StreamVideo 
								carID={`65ac9720191a85b6842de0ec`}
								camNumber={"65b6ff927c8483c5c4a474ab"}
								sourceNumber={0}
								isShowObjectDetection={isObjectDetectionOn}
								isStream={true}/>
							</SwiperSlide>

							<SwiperSlide>
								<StreamVideo 
								carID={`65ac9720191a85b6842de0ec`}
								camNumber={"65b6ff9c7c8483c5c4a474b1"}
								sourceNumber={0}
								isShowObjectDetection={isObjectDetectionOn}
								isStream={true}/>
							</SwiperSlide>
						</Swiper>
					</div>
					<div className='sub-video-container'>
						<Swiper
							onSwiper={handleSwiper}
							loop={true}
							spaceBetween={9}
							slidesPerView={4}
							freeMode={true}
							watchSlidesProgress={true}
							modules={[FreeMode, Navigation, Thumbs]}
							className="mySwiper"
						>
							<SwiperSlide>
								<StreamVideo 
								carID={`65ac9720191a85b6842de0ec`}
								camNumber={"65940703ce9bc3c043a77615"}
								sourceNumber={0}
								isShowObjectDetection={isObjectDetectionOn}
								isStream={false}/>
							</SwiperSlide>
							<SwiperSlide>
								<StreamVideo 
								carID={`65ac9720191a85b6842de0ec`}
								camNumber={"65b6ff827c8483c5c4a474a5"}
								sourceNumber={0}
								isShowObjectDetection={isObjectDetectionOn}
								isStream={false}/>
							</SwiperSlide>
							<SwiperSlide>
								<StreamVideo 
								carID={`65ac9720191a85b6842de0ec`}
								camNumber={"65b6ff927c8483c5c4a474ab"}
								sourceNumber={0}
								isShowObjectDetection={isObjectDetectionOn}
								isStream={false}/>
							</SwiperSlide>
							<SwiperSlide>
								<StreamVideo 
								carID={`65ac9720191a85b6842de0ec`}
								camNumber={"65b6ff9c7c8483c5c4a474b1"}
								sourceNumber={0}
								isShowObjectDetection={isObjectDetectionOn}
								isStream={false}/>
							</SwiperSlide>
						</Swiper>
					</div>
				</div>:null}
				
				<div className="detail-container">
					<div className="speed-container">
						<div className="current-speed-container">
							<div className="speed-text">Current Speed</div>
							<div className="speed-speed">{speed.toFixed(1)}</div>
							<div className="speed-unit">{unit}</div>
						</div>
						<div className="recommend-speed-container">
							<div className="speed-text">Recommend Speed</div>
							<div className="speed-speed">{recSpeed.toFixed(1)}</div>
							<div className="speed-unit">{unit}</div>
						</div>
					</div>
					<div className="another-detail-container">
						<div className="date-container">
							<div className="date">{date}</div>
							<div className="time">{time}</div>
						</div>
						<div>
							{isButtonVisible && (
								<button className="emergency-button" onClick={handleEmergency}>
									Emergency
								</button>
							)}
							{!isButtonVisible && (
								<div className="confirm-emergency-container">
									<button className="confirm-emergency-button" onClick={handleConfirmEmergency}>
										<FaBell style={{ width: 64, height: 45, color: 'white' }} />
									</button>
									<button className="cancle-emergency-button" onClick={handleCancleEmergency}>
										<FaXmark style={{ width: 65, height: 65, color: 'white' }} />
									</button>
								</div>
							)}
							{isPopupVisible && !isLocationUndefined &&(
								<div className="popup">
									<p className='popup-header'>Notification</p>
									<div className='popup-separator'></div>
									<p className='popup-content'>An emergency has been sent!</p>
								</div>
							)}
							{isPopupVisible && isLocationUndefined &&(
								<div className="popup">
									<p className='popup-header'>Notification</p>
									<div className='popup-separator'></div>
									<p className='popup-content'>Sent emergency failed :<br/>latitude or longitude is undefined!</p>
								</div>
							)}
						</div>
						<div className="button-container">
							<div>
								{isObjectDetectionOn && (
									<button className="od-button-on" onClick={handleObjectDetection}>
										<img src="/objDetectOn.png" alt="objDetectOn Icon" width="50" height="50" />
									</button>
								)}
								{!isObjectDetectionOn && (
									<button className="od-button-off" onClick={handleObjectDetection}>
										<img src="/objDetectOff.png" alt="objDetectOff Icon" width="50" height="50" />
									</button>
								)}
							</div>
							<button className="logout-button" onClick={handleLogout}>
								<MdOutlineExitToApp style={{ width: 60, height: 60, color: 'white' }} />
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	);
}
