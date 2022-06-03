//====================================================================================
// static XmlManager
//====================================================================================
// - XMLテキストをDOM形式にパース、XML内のオブジェクト
// 　検索などを行います。
//====================================================================================
export default class XmlManager{
	static parseXml(obj){
		const parser = new DOMParser();
		try{
			return parser.parseFromString(obj, "text/xml");
		}catch(e){
			throw e;
		}
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
