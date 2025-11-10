export function getNormalCookie(cookie: string) {
    return document.cookie.match("(^|;)\\s*" + cookie + "\\s*=\\s*([^;]+)")?.pop() || "";     
  }
    
export function getJsonCookie(cookie: string, valueName:string) {
    let aux = JSON.parse(decodeURIComponent(document.cookie.match("(^|;)\\s*" + cookie + "\\s*=\\s*([^;]+)")?.pop() || ""));
    return aux[valueName]; 
}