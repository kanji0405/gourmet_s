import React, { useState } from 'react';
import {XmlManager} from './Managers.js';
import Strings from './../json/Strings.json';

//====================================================================================
// function SearchRangeInput
//====================================================================================
// - 検索範囲の入力フォームをレンダリングします
//====================================================================================
export const SearchRangeInput = (props) => {
	const [selVal, setSelectValue] = useState('3');
	const [wordVal, setWordValue] = useState('');
	const bools = Object.keys(Strings.searchByBools).map((key, i)=>{
		const [val, setValue] = useState(false);
		const name = Strings.searchByBools[key];
		const labelKey = "bool-"+i;
		return (
			<label name={key} key={labelKey}>
				<input type="checkbox" defaultChecked={val} onChange={
					e => setValue(()=>e.target.checked !== true)
				}/>
				{name}
			</label>
		);
	});
	return (
		<div>
			<ul>
				<li>
					{Strings.searchByRange}
					<select value={selVal} onChange={e => setSelectValue(() => e.target.value)}>
						<option value="1">{Strings.searchRanges[0]}</option>
						<option value="2">{Strings.searchRanges[1]}</option>
						<option value="3">{Strings.searchRanges[2]}</option>
						<option value="4">{Strings.searchRanges[3]}</option>
						<option value="5">{Strings.searchRanges[4]}</option>
					</select>
				</li>
				<li>
					{Strings.searchByKeyword}
					<input type="text" value={wordVal} onChange={e => setWordValue(() => e.target.value)} />
				</li>
			</ul>
			<br style={{clear: "left"}}/>
			{bools}
			<input type="button" value={Strings.searchSubmit} onClick={
				props.onButtonClick.bind(
					props.parent, selVal, wordVal, bools
				)
			}/>
		</div>
	);
};


//====================================================================================
// class SearchResult
//====================================================================================
// - 検索結果を一覧で表示します。
//====================================================================================
export class SearchResult extends React.Component{
	constructor(props){
		super(props);
		this.page = 0;
	}
	knsMaxItem(){ return 5; }
	render(){
		const result = this.props.result;
		if (result.length === 0){
			return <div></div>;
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
			const currentShop = this.props.currentShop;
			return (<div>
				{this.knsRenderSearchResultPaging(curPage, maxPage)}
				{
					result.map((xml, i) =>{
						if (startItem <= i && i < endItem){
							return (
							<SearchedShop
								key={"shop"+i}
								xml={xml}
								currentShop={currentShop}
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
	knsGetText(xml, name){
		const element = XmlManager.getElementByTagName(xml, name);
		return element ? element.textContent : null;
	}
	render(){
		const xml = this.props.xml;
		const thumb = this.knsGetText(xml, 'logo_image');
		const onClick = this.props.onShopClick.bind(
			this.props.parent,
			xml,
			this.knsGetText(xml, 'lat'),
			this.knsGetText(xml, 'lng')
		);
		return (
		<table className={
			'shop-list ' + (xml === this.props.currentShop ? 'current-shop' : '')}>
			<tbody>
				<tr>
					<td className='shop-logo'>{
						thumb ?
						<img alt="logo_image" src={thumb} onClick={onClick}/> :
						<div onClick={onClick}></div>
					}</td>
					<td className='shop-info'>
						<p className='shop-name' onClick={onClick}>
							{this.knsGetText(xml, 'name') || Strings.shopNoInfo}
						</p>
						<p>{this.knsGetText(xml, 'catch') || Strings.shopNoInfo}</p>
						<p><span>{Strings.shopAccess}</span><br />{
						this.knsGetText(xml, 'mobile_access') || Strings.shopNoInfo
						}</p>
					</td>
				</tr>
			</tbody>
		</table>
		);
	}
}
