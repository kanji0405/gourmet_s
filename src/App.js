import './App.css';
import React, { useState } from 'react';
import ApiManager from './ApiManager.js';
import XmlManager from './XmlManager.js';
import Strings from './Strings.json';

/*
cd C:\Program Files (x86)\Google\Chrome\Application
chrome.exe --disable-web-security --user-data-dir="C://Chrome dev session"

http://localhost:3000/

*/

//====================================================================================
// function SearchRangeInput
//====================================================================================
// - 検索範囲の入力フォームをレンダリングします
//====================================================================================
const SearchRangeInput = (props) => {
	const [val, setValue] = useState('3');
	const onChange = (e) => setValue(() => e.target.value);
	return (
		<div>
			{Strings.searchByRange}
			<select value={val} onChange={onChange}>
				<option value="1">{Strings.searchRanges[0]}</option>
				<option value="2">{Strings.searchRanges[1]}</option>
				<option value="3">{Strings.searchRanges[2]}</option>
				<option value="4">{Strings.searchRanges[3]}</option>
				<option value="5">{Strings.searchRanges[4]}</option>
			</select>
			<input type="button" value={Strings.searchSubmit} onClick={
				props.onButtonClick.bind(props.parent, val)
			}/>
		</div>
	);
}


//====================================================================================
// class SearchResult
//====================================================================================
// - 検索結果を一覧で表示します。
//====================================================================================
class SearchResult extends React.Component{
	constructor(props){
		super(props)
		this.page = 0;
	}
	knsMaxItem(){ return 5; }
	render(){
		const result = this.props.result;
		if (result.length === 0){
			return <div></div>
		}else{
			if (this.props.isResultChanged === true){
				this.knsSetPage(0, false);
			}
			const maxItem = this.knsMaxItem();
			const curPage = this.page;
			const maxPage = Math.floor(
				(result.length - 1) / maxItem
			);
			const startItem = curPage * maxItem;
			const endItem = (curPage + 1) * maxItem;
			return (<div>
				{this.knsRenderSearchResultPaging(curPage, maxPage)}
				{
					result.map((xml, i) =>{
						if (startItem <= i && i < endItem){
							return (
							<SearchedShop
								key={"shop"+i}
								xml={xml}
								parent={this.props.parent}
								onShopClick={this.props.onShopClick}>
							</SearchedShop>
							);
						}else{
							return "";
						}
					})
				}
				{this.knsRenderSearchResultPaging(curPage, maxPage)}
			</div>);
		}
	}
	knsRenderSearchResultPaging(curPage, maxPage){
		return (
			<SearchResultPaging
				parent={this}
				onPageClick={this.knsSetPage}
				cur={curPage}
				max={maxPage}>
			</SearchResultPaging>
		);
	}
	knsSetPage(n, callRender){
		this.page = n;
		if (callRender === true) this.forceUpdate();
	}
}

//====================================================================================
// class SearchResultPaging
//====================================================================================
// - ページング機能を実装します
//====================================================================================
class SearchResultPaging extends React.Component{
	render(){
		const cur = this.props.cur, max = this.props.max;
		return (
			<div className='shop-paging'>
				{this.knsRenderOtherPage(
					Strings.previousPage, cur === 0, cur - 1
				)}
				<p className='shop-current-page'>
					{Strings.currentPage.replace(Strings.fmtNum, cur+1)}
				</p>
				{this.knsRenderOtherPage(
					Strings.nextPage, cur === max, cur + 1
				)}
			</div>
		);
	}
	knsRenderOtherPage(text, disabled, next){
		if (disabled === true){
			return (
				<p className='shop-page-disable'>{text}</p>
			);
		}else{
			return (
				<p onClick={this.props.onPageClick.bind(
					this.props.parent, next, true)}>{text}</p>
			);
		}
	}
}

//====================================================================================
// class SearchedShop
//====================================================================================
// - 店情報単体のレンダリングを行うクラスです
//====================================================================================
class SearchedShop extends React.Component{
	getText(xml, name){
		const element = XmlManager.getElementByTagName(xml, name);
		return element ? element.textContent : null;
	}
	render(){
		const xml = this.props.xml;
		const thumb = this.getText(xml, 'logo_image');
		const onClick = this.props.onShopClick.bind(
			this.props.parent,
			xml,
			this.getText(xml, 'lat'),
			this.getText(xml, 'lng')
		);
		return (
		<table className='shop-list'>
			<tbody>
				<tr>
					<td className='shop-logo'>{
						thumb ?
						<img alt="logo_image" src={thumb} onClick={onClick}/> :
						<div onClick={onClick}></div>
					}</td>
					<td className='shop-info'>
						<p className='shop-name' onClick={onClick}>
							{this.getText(xml, 'name') || Strings.shopNoInfo}
						</p>
						<p>{this.getText(xml, 'catch') || Strings.shopNoInfo}</p>
						<p><span>{Strings.shopAccess}</span><br />{
						this.getText(xml, 'mobile_access') || Strings.shopNoInfo
						}</p>
					</td>
				</tr>
			</tbody>
		</table>
		);
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

//====================================================================================
// class MainApp
//====================================================================================
// - ページ全体のレンダリング、GPS情報の取得などを行うメインクラスです。
//====================================================================================
class MainApp extends React.Component{
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
	knsOnArticleClose(){
		this.setState({currentShop: null});
	}
	knsOnShopClick(shop, lat, lon){
		this.knsUpdateMapPosition(lat, lon);
		this.setState({currentShop: shop});
	}
	knsSearch(range){
		this.setState({currentShop: null});
		this.setState({loading: true})
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

export default MainApp;
