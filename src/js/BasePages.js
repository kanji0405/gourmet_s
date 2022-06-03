import React from 'react';
import {ApiManager, XmlManager} from './Managers.js';
import {SearchRangeInput, SearchResult} from './SearchComponents.js';
import Strings from './../json/Strings.json';

/*
cd C:\Program Files (x86)\Google\Chrome\Application
chrome.exe --disable-web-security --user-data-dir="C://Chrome dev session"
http://localhost:3000/
*/

//====================================================================================
// class MainApp
//====================================================================================
// - ページ全体のレンダリング、GPS情報の取得などを行うメインクラスです。
//====================================================================================
export default class MainApp extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			gpsPos: null,
			searchResult: [],
			loading: false,
			currentShop: null
		};
		this.knsIsResultChanged = false;
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
		const lat = pos.coords.latitude;
		const lon = pos.coords.longitude
		this.setState({ gpsPos: {lat: lat, lon: lon}});
		this.knsUpdateMapPosition(lat, lon);
	}
	knsWhenGpsFailure(){
		this.setState({gpsPos: null});
	}
	knsUpdateMapPosition(lat, lon){
		const iframe = document.querySelector('iframe[title="Yahoo!地図"]');
		if (iframe){
			if (iframe.parentNode){
				iframe.parentNode.id = "YahooMapWrapper";
			}
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
					<p>{Strings.mainGpsFailed}</p>
				</div>
			);
		}else{
			let render = (
				<div>
					<header>
						<h1>グルメサーチャー</h1>
						{this.knsRenderSearchInputArea()}
					</header>
					<div className="App">
						{
						this.state.currentShop === null ?
						<p>{
							this.state.loading ? Strings.mainLoading :
							this.state.searchResult.length === 0 ?
							Strings.mainSearchNoHit :
							Strings.mainSearchSomeHit.replace(
								Strings.fmtNum, this.state.searchResult.length
							)
						}</p> :
						<ShopArticle
						shop={this.state.currentShop}
						onClose={this.knsOnArticleClose.bind(this)}
						></ShopArticle>
						}
						{this.knsRenderResultArea()}
					</div>
				</div>
			);
			this.knsIsResultChanged = false;
			return render;
		}
	}
	knsRenderSearchInputArea(){
		return (
			<div id="searchInputArea">
				<SearchRangeInput
				parent={this}
				onButtonClick={this.knsSearch}>
				</SearchRangeInput>
			</div>
		);
	}
	knsRenderResultArea(){
		return (
			<div id="searchResultArea">
				<SearchResult
				isResultChanged={this.knsIsResultChanged}
				parent={this}
				onShopClick={this.knsOnShopClick}
				result={this.state.searchResult}
				>
				</SearchResult>
			</div>
		);
	}
	knsOnShopClick(shop, lat, lon){
		if (this.state.currentShop === shop){
			this.knsOnArticleClose();
		}else{
			this.knsUpdateMapPosition(lat, lon);
			this.setState({currentShop: shop});
		}
	}
	knsOnArticleClose(){
		const pos = this.state.gpsPos;
		this.knsUpdateMapPosition(pos.lat, pos.lon);
		this.setState({currentShop: null});
	}
	knsSearch(range){
		this.setState({currentShop: null, loading: true});
		this.knsIsResultChanged = true;
		const pos = this.state.gpsPos;
		ApiManager.getAPI(
			ApiManager.CATE_GOURMET, ApiManager.API_VERSION_1,
			{lat: pos.lat, lng: pos.lon, range: range}
		).then(res => {
			try{
				const xml = XmlManager.parseXml(res);
				const shops = XmlManager.getElementsByTagName(
					xml, 'shop'
				);
				this.setState({
					searchResult: shops,
					loading: false
				});
			}catch(e){
				throw e;
			}
		});
	}
}

//====================================================================================
// class ShopArticle
//====================================================================================
// - ショップの詳細情報を表示します。
//====================================================================================
class ShopArticle extends React.Component{
	getText(xml, name){
		const element = XmlManager.getElementByTagName(xml, name);
		return element ? element.textContent : null;
	}
	render(){
		const xml = this.props.shop;
		return (
			<article>
				<h2>{this.getText(xml, 'name')}</h2>
				<p onClick={this.props.onClose}>{Strings.shopInfoClose}</p>
			</article>
		);
	}
}
