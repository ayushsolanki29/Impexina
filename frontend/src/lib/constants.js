/** App-wide constants (single source of truth, no env needed) */
import { version } from "../../package.json";

export const APP_VERSION = version;

/** Default company details for Packing List & Invoice (same structure, same values) */
export const DEFAULT_COMPANY_DETAILS = {
  // Exporter (used by both)
  headerCompanyName: 'YIWU ZHOULAI TRADING CO., LIMITED',
  headerCompanyAddress: 'Room 801, Unit 3, Building 1, Jiuheyuan, Jiangdong Street, Yiwu City, Jinhua City, Zhejiang Province',
  headerPhone: '13735751445',
  // Consignee - Invoice uses consignee*, Packing uses seller*
  consigneeName: 'IMPEXINA GLOBAL PVT LTD',
  consigneeAddress: 'GROUND FLOOR, C-5, GAMI INDUSTRIAL PARK PAWANE MIDC ROAD NAVI MUMBAI, THANE, MAHARASHTRA, 400705',
  consigneeIecNo: 'AAHCI1462J',
  consigneeGst: '27AAHCI1462J1ZG',
  consigneeEmail: 'impexina91@gmail.com',
  sellerCompanyName: 'IMPEXINA GLOBAL PVT LTD',
  sellerAddress: 'GROUND FLOOR, C-5, GAMI INDUSTRIAL PARK PAWANE MIDC ROAD NAVI MUMBAI, THANE, MAHARASHTRA, 400705',
  sellerIecNo: 'AAHCI1462J',
  sellerGst: '27AAHCI1462J1ZG',
  sellerEmail: 'impexina91@gmail.com',
  stampText: 'Authorized Signatory',
  stampPosition: 'BOTTOM_RIGHT',
  stampSize: 'M',
  to: 'NHAVA SHEVA',
};
