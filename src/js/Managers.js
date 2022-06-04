//====================================================================================
// static ApiManager
//====================================================================================
// - APIを叩く静的クラスです
//====================================================================================
import apiKey from './../json/api-key.json';

export class ApiManager{
	static BASE_URL = "https://webservice.recruit.co.jp:443/";
	static CATE_GOURMET = 'gourmet';
	static CATE_SHOP = 'shop';
	static CATE_BUDGET = 'budget';
	static CATE_LARGE_SERVICE_AREA = 'large_service_area';
	static CATE_SERVICE_AREA = 'service_area';
	static CATE_LARGE_AREA = 'large_area';
	static CATE_MIDDLE_AREA = 'middle_area';
	static CATE_SMALL_AREA = 'small_area';
	static CATE_GENRE = 'genre';
	static CATE_CREDIT = 'credit_card';
	static CATE_SPECIAL = 'special';
	static CATE_SPECIAL_CATEGORY = 'special_category';
	static API_VERSION_1 = 'v1';
	static parseUrl(category, version, query) {
		if (version === undefined){
			version = "";
		}else{
			version += "/";
		}
		query = this.parseQuery(query);
		return new URL(this.BASE_URL + "hotpepper/" + category + '/' + version + query);
	}
	static parseQuery(obj){
		if (typeof obj !== 'object') obj = {};
		obj["key"] = apiKey.HotPepper;
		let str = "?";
		const keys = Object.keys(obj);
		keys.forEach((key, i) => {
			str += key + "=" + obj[key];
			if (i + 1 !== keys.length) str += '&';
		});
		return str;
	}
	static async getAPI(category, version, query) {
		return new Promise((resolve, reject) => {
			try {
				const url = this.parseUrl(category, version, query).href;
				fetch(url, {
					method: 'GET',
					mode: 'cors',
					headers: {
						'Accept': 'application/xml',
						'Content-Type': 'application/xml',
						'Access-Control-Allow-Origin': this.BASE_URL
					},
					credentials: 'include',
					cache: 'no-cache',
				}).then((res) => {
						if (res.ok) {
							resolve(res.text());
						} else {
							throw new Error(res.type);
						}
				});
			} catch (e) {
				reject(null);
				throw e;
			}
		});
	}
}

//====================================================================================
// static XmlManager
//====================================================================================
// - XMLテキストをDOM形式にパース、XML内のオブジェクト
//   検索などを行います。
//====================================================================================
export class XmlManager{
	static parseXml(obj){
		const parser = new DOMParser();
		return parser.parseFromString(obj, "application/xml");
	}
    static getElementsByTagName(xml, name){
        return Array.from(xml.getElementsByTagName(name));
    }
    static getElementByTagName(xml, name){
        return this.getElementsByTagName(xml, name)[0];
    }
    static querySelectorAll(xml, cond){
        return Array.from(xml.querySelectorAll(cond));
    }
    static querySelector(xml, cond){
        return Array.from(xml.querySelector(cond));
    }
}
