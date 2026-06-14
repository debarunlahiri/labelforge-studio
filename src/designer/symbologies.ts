export type SymbologyOption = {
  label: string
  value: string
  bwip?: string
  supported?: boolean
  notes?: string
}

export type SymbologyGroup = {
  label: string
  options: SymbologyOption[]
}

export const qrSymbologyGroups: SymbologyGroup[] = [
  {
    label: 'QR Code Family',
    options: [
      { label: 'QR Code', value: 'QRCode', bwip: 'qrcode' },
      { label: 'Micro QR Code', value: 'MicroQRCode', bwip: 'microqrcode' },
      { label: 'iQR Code', value: 'iQRCode', bwip: 'qrcode', notes: 'Rendered as QR preview; export engine can map to printer-native iQR where available' },
      { label: 'GS1 QR Code', value: 'GS1QRCode', bwip: 'gs1qrcode', notes: 'Requires GS1 formatted data' },
      { label: 'GS1 Digital Link QR Code', value: 'GS1DigitalLinkQRCode', bwip: 'gs1dlqrcode', notes: 'Requires GS1 Digital Link URI' },
    ],
  },
]

export const barcodeSymbologyGroups: SymbologyGroup[] = [
  {
    label: '2D Matrix',
    options: [
      { label: 'Aztec Code', value: 'AztecCode', bwip: 'azteccode' },
      { label: 'Aztec Rune', value: 'AztecRune', bwip: 'aztecrune' },
      { label: 'Data Matrix', value: 'DataMatrix', bwip: 'datamatrix' },
      { label: 'GS1 DataMatrix', value: 'GS1DataMatrix', bwip: 'gs1datamatrix' },
      { label: 'DotCode', value: 'DotCode', bwip: 'dotcode' },
      { label: 'Grid Matrix', value: 'GridMatrix', supported: false },
      { label: 'Han Xin Code', value: 'HanXinCode', bwip: 'hanxin' },
      { label: 'Maxicode', value: 'Maxicode', bwip: 'maxicode' },
    ],
  },
  {
    label: '2D Stacked',
    options: [
      { label: 'PDF417', value: 'PDF417', bwip: 'pdf417' },
      { label: 'Compact PDF417', value: 'CompactPDF417', bwip: 'pdf417compact' },
      { label: 'PDF417 Truncated', value: 'PDF417Truncated', bwip: 'pdf417truncated' },
      { label: 'MicroPDF417', value: 'MicroPDF417', bwip: 'micropdf417' },
      { label: 'CODABLOCK F', value: 'CodablockF', bwip: 'codablockf' },
      { label: 'Code 16K', value: 'Code16K', bwip: 'code16k' },
      { label: 'Code 49', value: 'Code49', bwip: 'code49' },
      { label: 'GS1 DataBar Expanded Stacked', value: 'GS1DataBarExpandedStacked', bwip: 'databarexpandedstacked' },
      { label: 'GS1 DataBar Stacked', value: 'GS1DataBarStacked', bwip: 'databarstacked' },
      { label: 'GS1 DataBar Stacked Omnidirectional', value: 'GS1DataBarStackedOmnidirectional', bwip: 'databarstackedomni' },
      { label: 'TLC39 MicroPDF417', value: 'TLC39MicroPDF417', supported: false },
    ],
  },
  {
    label: 'Common 1D / Linear',
    options: [
      { label: 'Code 128', value: 'Code128', bwip: 'code128' },
      { label: 'Code 39 Regular', value: 'Code39', bwip: 'code39' },
      { label: 'Code 39 Full ASCII', value: 'Code39FullASCII', bwip: 'code39ext' },
      { label: 'Code 93', value: 'Code93', bwip: 'code93' },
      { label: 'Code 93i', value: 'Code93i', supported: false },
      { label: 'Codabar', value: 'Codabar', bwip: 'rationalizedCodabar' },
      { label: 'Code 11', value: 'Code11', bwip: 'code11' },
      { label: 'Interleaved 2-of-5', value: 'Interleaved2of5', bwip: 'interleaved2of5' },
      { label: 'Industrial 2-of-5', value: 'Industrial2of5', bwip: 'industrial2of5' },
      { label: 'Standard 2-of-5', value: 'Standard2of5', bwip: 'standard2of5' },
      { label: 'Matrix 2-of-5', value: 'Matrix2of5', bwip: 'matrix2of5' },
      { label: 'IATA 2-of-5', value: 'IATA2of5', bwip: 'iata2of5' },
      { label: 'Datalogic 2-of-5', value: 'Datalogic2of5', bwip: 'datalogic2of5' },
      { label: 'NEC 2-of-5', value: 'NEC2of5', bwip: 'coop2of5' },
      { label: 'MSI Plessey', value: 'MSIPlessey', bwip: 'msi' },
      { label: 'Anker Plessey', value: 'AnkerPlessey', bwip: 'plessey' },
      { label: 'UK Plessey', value: 'UKPlessey', bwip: 'plessey' },
      { label: 'Telepen', value: 'Telepen', bwip: 'telepen' },
      { label: 'Trioptic', value: 'Trioptic', bwip: 'code39' },
      { label: 'BC412', value: 'BC412', bwip: 'bc412' },
      { label: 'Channel Code', value: 'ChannelCode', bwip: 'channelcode' },
      { label: 'PosiCode A', value: 'PosiCodeA', bwip: 'posicode' },
      { label: 'PosiCode B', value: 'PosiCodeB', bwip: 'posicode' },
      { label: 'PosiCode Limited A', value: 'PosiCodeLimitedA', bwip: 'posicode' },
      { label: 'PosiCode Limited B', value: 'PosiCodeLimitedB', bwip: 'posicode' },
      { label: 'ISS Code 128', value: 'ISSCode128', bwip: 'code128' },
      { label: 'UCC/EAN-128', value: 'UCCEAN128', bwip: 'gs1-128' },
      { label: 'GS1-128', value: 'GS1128', bwip: 'gs1-128' },
    ],
  },
  {
    label: 'Retail',
    options: [
      { label: 'UPC-A', value: 'UPCA', bwip: 'upca' },
      { label: 'UPC-E', value: 'UPCE', bwip: 'upce' },
      { label: 'UPC-A with 2 Digit Add On', value: 'UPCAAddon2', bwip: 'upca' },
      { label: 'UPC-A with 5 Digit Add On', value: 'UPCAAddon5', bwip: 'upca' },
      { label: 'UPC-E with 2 Digit Add On', value: 'UPCEAddon2', bwip: 'upce' },
      { label: 'UPC-E with 5 Digit Add On', value: 'UPCEAddon5', bwip: 'upce' },
      { label: 'EAN-8', value: 'EAN8', bwip: 'ean8' },
      { label: 'EAN-13', value: 'EAN13', bwip: 'ean13' },
      { label: 'EAN-13 with 2 Digit Add On', value: 'EAN13Addon2', bwip: 'ean13' },
      { label: 'EAN-13 with 5 Digit Add On', value: 'EAN13Addon5', bwip: 'ean13' },
      { label: 'JAN-8', value: 'JAN8', bwip: 'ean8' },
      { label: 'JAN-13', value: 'JAN13', bwip: 'ean13' },
      { label: 'ISBN-13', value: 'ISBN13', bwip: 'isbn' },
      { label: 'DUN-14', value: 'DUN14', bwip: 'itf14' },
      { label: 'ITF-14', value: 'ITF14', bwip: 'itf14' },
    ],
  },
  {
    label: 'GS1',
    options: [
      { label: 'GS1-128', value: 'GS1128', bwip: 'gs1-128' },
      { label: 'GS1 DataBar', value: 'GS1DataBar', bwip: 'databaromni' },
      { label: 'GS1 DataBar Omnidirectional', value: 'GS1DataBarOmnidirectional', bwip: 'databaromni' },
      { label: 'GS1 DataBar Truncated', value: 'GS1DataBarTruncated', bwip: 'databartruncated' },
      { label: 'GS1 DataBar Limited', value: 'GS1DataBarLimited', bwip: 'databarlimited' },
      { label: 'GS1 DataBar Expanded', value: 'GS1DataBarExpanded', bwip: 'databarexpanded' },
      { label: 'GS1 DataBar Expanded Stacked', value: 'GS1DataBarExpandedStacked', bwip: 'databarexpandedstacked' },
      { label: 'GS1 DataBar Stacked', value: 'GS1DataBarStacked', bwip: 'databarstacked' },
      { label: 'GS1 DataBar Stacked Omnidirectional', value: 'GS1DataBarStackedOmnidirectional', bwip: 'databarstackedomni' },
      { label: 'GS1 DataMatrix', value: 'GS1DataMatrix', bwip: 'gs1datamatrix' },
      { label: 'GS1 Composite', value: 'GS1Composite', bwip: 'gs1-cc' },
      { label: 'Composite', value: 'Composite', bwip: 'gs1-cc' },
      { label: 'RSS', value: 'RSS', bwip: 'databaromni' },
    ],
  },
  {
    label: 'Composite',
    options: [
      { label: 'GS1 Composite', value: 'GS1Composite', bwip: 'gs1-cc' },
      { label: 'Composite', value: 'Composite', bwip: 'gs1-cc' },
      { label: 'EAN-8 & CC-A/B', value: 'EAN8CCAB', bwip: 'ean8composite' },
      { label: 'EAN-13 & CC-A/B', value: 'EAN13CCAB', bwip: 'ean13composite' },
      { label: 'UPC-A & CC-A/B', value: 'UPCACCAB', bwip: 'upcacomposite' },
      { label: 'UPC-E & CC-A/B', value: 'UPCECCAB', bwip: 'upcecomposite' },
      { label: 'GS1-128 & CC-A/B', value: 'GS1128CCAB', bwip: 'gs1-128composite' },
      { label: 'GS1-128 & CC-C', value: 'GS1128CCC', bwip: 'gs1-128composite' },
      { label: 'GS1 DataBar Expanded & CC-A/B', value: 'GS1DataBarExpandedCCAB', bwip: 'databarexpandedcomposite' },
      { label: 'GS1 DataBar Expanded Stacked & CC-A/B', value: 'GS1DataBarExpandedStackedCCAB', bwip: 'databarexpandedstackedcomposite' },
      { label: 'GS1 DataBar Limited & CC-A/B', value: 'GS1DataBarLimitedCCAB', bwip: 'databarlimitedcomposite' },
      { label: 'GS1 DataBar Omnidirectional & CC-A/B', value: 'GS1DataBarOmnidirectionalCCAB', bwip: 'databaromnicomposite' },
      { label: 'GS1 DataBar Stacked & CC-A/B', value: 'GS1DataBarStackedCCAB', bwip: 'databarstackedcomposite' },
      { label: 'GS1 DataBar Stacked Omnidirectional & CC-A/B', value: 'GS1DataBarStackedOmnidirectionalCCAB', bwip: 'databarstackedomnicomposite' },
      { label: 'GS1 DataBar Truncated & CC-A/B', value: 'GS1DataBarTruncatedCCAB', bwip: 'databartruncatedcomposite' },
    ],
  },
  {
    label: 'Postal and Shipping',
    options: [
      { label: 'Australia Post', value: 'AustraliaPost', bwip: 'auspost' },
      { label: 'Canadian Customs', value: 'CanadianCustoms', supported: false },
      { label: 'CEPNet Brasil', value: 'CEPNetBrasil', bwip: 'cepnet' },
      { label: 'Deutsche Post Identcode', value: 'DeutschePostIdentcode', bwip: 'identcode' },
      { label: 'Deutsche Post Leitcode', value: 'DeutschePostLeitcode', bwip: 'leitcode' },
      { label: 'Japanese Post', value: 'JapanesePost', bwip: 'japanpost' },
      { label: 'KIX Code', value: 'KIXCode', bwip: 'kix' },
      { label: 'Korea Post', value: 'KoreaPost', bwip: 'koreapost' },
      { label: 'Royal Mail 4-State Mailmark Type C', value: 'RoyalMailMailmarkC', bwip: 'mailmark' },
      { label: 'Royal Mail 4-State Mailmark Type L', value: 'RoyalMailMailmarkL', bwip: 'mailmark' },
      { label: 'Royal Mail CMDM Mailmark', value: 'RoyalMailCMDMMailmark', bwip: 'mailmark' },
      { label: 'Royal Mail Customer Bar Code', value: 'RoyalMailCustomerBarCode', bwip: 'royalmail' },
      { label: 'USPS Intelligent Mail', value: 'USPSIntelligentMail', bwip: 'onecode' },
      { label: 'USPS Planet', value: 'USPSPlanet', bwip: 'planet' },
      { label: 'USPS Postnet', value: 'USPSPostnet', bwip: 'postnet' },
      { label: 'UPS Tracking', value: 'UPSTracking', supported: false },
    ],
  },
  {
    label: 'Circular',
    options: [
      { label: 'Circular Code 39', value: 'CircularCode39', supported: false },
      { label: 'Circular Code 93', value: 'CircularCode93', supported: false },
      { label: 'Circular Code 128', value: 'CircularCode128', supported: false },
      { label: 'Circular Interleaved 2-of-5', value: 'CircularInterleaved2of5', supported: false },
    ],
  },
  {
    label: 'Pharmaceutical / Healthcare / Special',
    options: [
      { label: 'PPN', value: 'PPN', supported: false },
      { label: 'OPC', value: 'OPC', bwip: 'pharmacode' },
      { label: 'TLC39', value: 'TLC39', supported: false },
      { label: 'TLC39 MicroPDF417', value: 'TLC39MicroPDF417', supported: false },
      { label: 'HIBC Code 39', value: 'HIBCCode39', bwip: 'hibccode39' },
      { label: 'HIBC Code 128', value: 'HIBCCode128', bwip: 'hibccode128' },
      { label: 'HIBC Data Matrix', value: 'HIBCDataMatrix', bwip: 'hibcdatamatrix' },
      { label: 'GS1 DataMatrix for pharma', value: 'GS1DataMatrixPharma', bwip: 'gs1datamatrix' },
      { label: 'GS1-128 pharma labels', value: 'GS1128Pharma', bwip: 'gs1-128' },
    ],
  },
]

export const allSymbologies = [...barcodeSymbologyGroups, ...qrSymbologyGroups]
  .flatMap((group) => group.options)

export const symbologyByValue = Object.fromEntries(
  allSymbologies.map((option) => [option.value, option])
) as Record<string, SymbologyOption>

export function getBwipSymbology(value: string) {
  return symbologyByValue[value]?.bwip || value.toLowerCase()
}

export function getSymbologyLabel(value: string) {
  return symbologyByValue[value]?.label || value
}

export function isQrFamilySymbology(value: string) {
  return qrSymbologyGroups.some((group) => group.options.some((option) => option.value === value))
}
