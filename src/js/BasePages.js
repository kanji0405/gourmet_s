import React from 'react';
import {ApiManager, XmlManager} from './Managers.js';
import {SearchRangeInput, SearchResult} from './SearchComponents.js';
import Strings from './../json/Strings.json';

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
		const lon = pos.coords.longitude;
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
			href = iframe.src.replace(/([?&])(?:lat|lon|zoom)=\d+(?:\.\d+)?/g,
			(all, partition)=> partition === '?' ? '?' : '');
			iframe.src = href + `&lat=${lat}&lon=${lon}&zoom=18`;
		}
	}
	render(){
		if (this.state.gpsPos === null){
			return (
				<div>
					<header>
						<h1>{Strings.title}</h1>
						{this.knsRenderSearchInputArea()}
					</header>
					<div className="App">
						<p>{Strings.mainGpsFailed}</p>
					</div>
				</div>
			);
		}else{
			let render = (
				<div>
					<header>
						<div className='logo-gg-wrapper'>
							<i className="gg-search"></i>
						</div>
						<h1>{Strings.title}</h1>
					</header>
					<div className="App">
						{this.knsRenderSearchInputArea()}
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
				currentShop={this.state.currentShop}
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
			window.scrollTo(0, 0);
			this.knsUpdateMapPosition(lat, lon);
			this.setState({currentShop: shop});
		}
	}
	knsOnArticleClose(){
		const pos = this.state.gpsPos;
		this.knsUpdateMapPosition(pos.lat, pos.lon);
		this.setState({currentShop: null});
	}
	knsSearch(range, keyword, bools){
		this.setState({currentShop: null, loading: true});
		this.knsIsResultChanged = true;
		const pos = this.state.gpsPos;
		const obj = {lat: pos.lat, lng: pos.lon, range: range};
		bools.forEach(b => {
			const name = b.props.name;
			const input = document.querySelector(
				`label[name="${name}"] input`);
			if (input.checked === true) obj[name] = 1;
		});
		if (keyword.length !== 0) obj.keyword = keyword;
		ApiManager.getAPI(
			ApiManager.CATE_GOURMET, ApiManager.API_VERSION_1, obj
		).then(res => {
			const xml = XmlManager.parseXml(res);
			const shops = XmlManager.getElementsByTagName(xml, 'shop');
			this.setState({
				searchResult: shops,
				loading: false
			});
		}).catch(e => {throw e; });
	}
}

//====================================================================================
// class ShopArticle
//====================================================================================
// - ショップの詳細情報を表示します。
//====================================================================================
class ShopArticle extends React.Component{
	static RE_POSITIVE = /^(?:あり|利用可|営業している|お子様連れ歓迎|お子様連れOK)(?: ：(.+))?/;
	static RE_NEGATIVE = /^(?:なし|不可|利用不可|全面禁煙|営業していない)(?: ：(.+))?/;
	static RE_NOT_CHECKED = /^(?:未確認)(?: ：(.+))?/;
	knsGetText(xml, name){
		const element = XmlManager.getElementByTagName(xml, name);
		return element ? element.textContent : null;
	}
	knsRenderAvailable(xml, i, name, key){
		let text = this.knsGetText(xml, key);
		let info = "";
		if (typeof text !== 'string'){
			text = <i className="gg-read"></i>;
		}else if (ShopArticle.RE_NOT_CHECKED.test(text)){
			text = <i className="gg-read"></i>;
			info = RegExp.$1;
		}else if (ShopArticle.RE_POSITIVE.test(text)){
			text = <i className="gg-check"></i>;
			info = RegExp.$1;
		}else if (ShopArticle.RE_NEGATIVE.test(text)){
			text = <i className="gg-close"></i>;
			info = RegExp.$1;
		}
		return (
			<tr key={"shop-info" + i}>
				<th><h3>{name}</h3></th>
				<td>
				{
					typeof text === 'string' ?
					<React.Fragment>{text}<br/></React.Fragment> :
					<div className='gg-wrapper'>{text}</div>
				}
				<p>{info}</p>
				</td>
			</tr>
		);
	}
	render(){
		const xml = this.props.shop;
		const thumb = this.knsGetText(xml, 'logo_image');
		const noInfo = Strings.shopNoInfo;
		let photo = XmlManager.getElementByTagName(
			xml, 'photo').querySelector('pc l, mobile l');
		return (
		<article className="shop-article">
			<table className='shop-main-info'>
				<tbody>
					<tr>
						<th rowSpan="2">{
							thumb ? <img alt="logo_image" src={thumb}/> :
							<div></div>
						}</th>
						<th className='info-header'>
							<h2><a
							className='clickable'
							href={this.knsGetText(xml, 'urls') || ""}
							target="_blank"
							rel="noreferrer">
								<ruby>
									{this.knsGetText(xml, 'name') || noInfo}
									<rp>(</rp>
									<rt>{this.knsGetText(xml, 'name_kana') || noInfo}</rt>
									<rp>)</rp>
								</ruby>
							</a></h2>
						</th>
					</tr>
					<tr>
						<th className='info-header'>
							<p>{this.knsGetText(xml, 'address') || noInfo}</p>
						</th>
					</tr>
					<tr>
						<th><h3>{Strings.shopInfoAccess}</h3></th>
						<td><p>{this.knsGetText(xml, 'access') || noInfo}</p></td>
					</tr>
					<tr>
						<th><h3>{Strings.shopInfoOpenTime}</h3></th>
						<td><p>{this.knsGetText(xml, 'open') || noInfo}</p></td>
					</tr>
					<tr>
						<th><h3>{Strings.shopInfoCloseTime}</h3></th>
						<td><p>{this.knsGetText(xml, 'close') || noInfo}</p></td>
					</tr>
				</tbody>
			</table>
			<table className='shop-sub-info'>
				<tbody>
					{
					Object.keys(Strings.shopInfoSubInfos).map(
						(key, i) => this.knsRenderAvailable(
							xml, i, Strings.shopInfoSubInfos[key], key)
					)
					}
				</tbody>
			</table>
			{photo ? <img alt="images" src={photo.textContent} /> : ""}
			<p
			className='clickable close-button'
			onClick={this.props.onClose}>
			<i className="gg-close-o"></i>
			{Strings.shopInfoClose}
			</p>
		</article>
		);
	}
}
