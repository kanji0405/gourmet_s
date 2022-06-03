import './App.css';
import React, { useState } from 'react';
import ApiManager from './ApiManager.js';

/*
cd C:\Program Files (x86)\Google\Chrome\Application
chrome.exe --disable-web-security --user-data-dir="C://Chrome dev session"

http://localhost:3000/

*/

const SearchRangeInput = (props) => {
	const [val, setValue] = useState('15');
	const onChange = (e) => {
		setValue(() => e.target.value)
	}
	return (
		<div>
			検索半径：
			<input type="number" min="1" value={val} onChange={onChange}/>m
			<input type="button" value="検索" onClick={props.onButtonClick}/>
		</div>
	);
}

class App extends React.Component{
	constructor(props){
		super(props);
		this.state = { gpsPos: null };
	}
	componentDidMount() {
		this.knsInitVariables();
	}
	knsInitVariables(){
		if (navigator.geolocation){
			navigator.geolocation.getCurrentPosition(
				this.knsWhenGpsSucceed.bind(this),
				this.knsWhenGpsFailure.bind(this)
			);
		}else{
			this.knsWhenGpsFailure();
		}
	}
	knsWhenGpsSucceed(pos){
		this.setState({
			gpsPos: {lat: pos.coords.latitude, lon: pos.coords.longitude}
		});
	}
	knsWhenGpsFailure(){
		this.setState({gpsPos: null});
	}
	knsUpdateMapPosition(lat, lon){
		const iframe = document.querySelector('iframe[title="Yahoo!地図"]');
		if (iframe){
			let href = iframe.src;
			href = iframe.src.replace(/([?&])(?:lat|lon|zoom)\=\d+(?:\.\d+)?/g,
			(all, partition, type)=> partition === '?' ? '?' : '');
			iframe.src = href + `&lat=${lat}&lon=${lon}&zoom=18`;
		}
	}
	render(){
		if (this.state.gpsPos === null){
			return (
				<div className="App">
					<p>位置情報が取得できませんでした。</p>
				</div>
			);
		}else{
			this.knsUpdateMapPosition(this.state.gpsPos.lat, this.state.gpsPos.lon);
			return (
				<div className="App">
					<SearchRangeInput onButtonClick={this.knsSearch.bind(this)}>
					</SearchRangeInput>
				</div>
			);
		}
	}
	knsSearch(){
		ApiManager.getAPI(
			ApiManager.CATE_GOURMET, ApiManager.API_VERSION_1,
			{id: 10}
		).then(res => console.log(ApiManager.parseXml(res)));
	}
}

export default App;
