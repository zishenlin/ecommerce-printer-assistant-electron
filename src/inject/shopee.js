const pagebreak = '<div class="pagebreak-group"><div class="pagebreak"></div><div>&nbsp;</div></div>';

/**
 * 蝦皮7-11
 */
function shopeeFormat711(shipDetails) {
    const details = shipDetails ? JSON.parse(shipDetails) : '';
    Array.prototype.slice
        .call(document.querySelectorAll('table~p'))
        .forEach(p => p.outerHTML = pagebreak);
    document.querySelectorAll('.pagebreak-group').length > 0 &&
        document.querySelector('.pagebreak-group:last-child').remove();

    const queryEle =
        document.querySelectorAll('body>#Panel1>table').length > 0
            ? document.querySelectorAll('body>#Panel1>table')
            : document.querySelectorAll('body>table');
    const mainTable = Array.prototype.slice.call(queryEle);
    mainTable.forEach(tableEle => execute(tableEle));

    function execute(layer1Table) {
        const layer1TableBody = layer1Table.querySelector('tbody');
        const layer1TableTR = layer1Table.querySelector('tbody').children;
        const trArray = Array.prototype.slice.call(layer1TableTR);

        const innerHTML = trArray
            .map(tr =>
                Array.prototype.slice.call(tr.children).reduce((previous, current) => {
                    current.style.border = '';
                    let html;

                    if (current.childElementCount > 0) {
                        if (!details) {
                            html = `<tr>${current.outerHTML}</tr>${pagebreak}`;
                        } else {
                            const noteTraceNo = current.querySelectorAll('td.style8>span')[0].innerText;
                            const detailEle = generateDetailEle(details.filter(d => d.traceNo === noteTraceNo)[0]);
                            html = `<tr>${current.outerHTML}</tr>${pagebreak}<tr>${detailEle}</tr>${pagebreak}`;
                        }
                    } else {
                        html = '';
                    }

                    return `${previous}${html}`;
                }, '')
            )
            .reduce((previous, current) => previous + current);

        layer1TableBody.innerHTML = innerHTML;
        document.querySelector('.pagebreak-group:last-child').remove();
    }
}

/**
 * 蝦皮萊爾富
 */
function shopeeFormatHilife(shipDetails) {
    const details = shipDetails ? JSON.parse(shipDetails) : '';
    Array.prototype.slice
        .call(document.querySelectorAll('body>strong>p'))
        .forEach(p => p.outerHTML = pagebreak);

    const mainTable = Array.prototype.slice
        .call(document.querySelectorAll('body>strong>table.style1'));
    mainTable.forEach(tableEle => execute(tableEle));

    function execute(outerTable) {
        const layer2TableBody = outerTable.querySelector('table').querySelector('tbody');
        const layer2TableTR = outerTable.querySelector('table').querySelector('tbody').children;
        const trArray = Array.prototype.slice.call(layer2TableTR);

        const innerHTML = trArray
            .map(tr =>
                Array.prototype.slice.call(tr.children).reduce((previous, current) => {
                    let html;

                    if (current.childElementCount > 0) {
                        if (!details) {
                            html = `<tr>${current.outerHTML}</tr>${pagebreak}`;
                        } else {
                            const noteOrderSn = current.querySelector('.style5[rowspan]').firstElementChild.innerText.substr(5);
                            const detailEle = generateDetailEle(details.filter(d => d.orderSn === noteOrderSn)[0]);
                            html = `<tr>${current.outerHTML}</tr>${pagebreak}<tr>${detailEle}</tr>${pagebreak}`;
                        }
                    } else {
                        html = '';
                    }

                    return `${previous}${html}`;
                }, '')
            )
            .reduce((previous, current) => previous + current);

        layer2TableBody.innerHTML = innerHTML;
        document.querySelector('.pagebreak-group:last-child').remove();
    }
}

/**
 * 出貨明細
 */
function generateDetailEle(detail) {
    if (!detail) {
        return null;
    }

    const ele = `
    <td>
        <div class="detail-div">
            <table class="detail-main-table">
                 <tbody>
                    <tr>
                        <th>訂單編號</th>
                        <td>${detail.orderSn}</td>
                    </tr>
                    <tr>
                        <th>收件人</th>
                        <td>${detail.buyerInfo}</td>
                    </tr>
                    <tr>
                        <th>收件地址</th>
                        <td>${detail.shippingAddr}</td>
                    </tr>
                    <tr>
                        <th>取件編號</th>
                        <td>${detail.traceNo}</td>
                    </tr>
                </tbody>
            </table>   
            <table class="detail-product-table">
                <thead><tr><th style="width: 10em;">商品</th><th>主貨號</th><th>選項</th><th>次貨號</th><th>數量</th><th>總金額</th></tr></thead>
                <tbody>` +
        detail.items.map(item => {
            return (item.bundleDeal
                ? `
                    <tr>
                        <td colspan="6" style="text-align: center;">
                            ${item.bundleDeal}
                        </td>
                </tr>`
                : `
                    <tr>
                        <td>${item.name}（單價：${item.price}）</td>
                        <td>${item.sku ? item.sku : '-'}</td>
                        <td>${item.modelOption ? item.modelOption : '-'}</td>
                        <td>${item.modelSku ? item.modelSku : '-'}</td>
                        <td>${item.amount}</td>
                        <td>${item.total}</td>
                    </tr>`) +
                item.itemList.map((val, idx, arr) => {
                    return `<tr>
                                <td>${val.name}（單價：${val.price}）</td>
                                <td>${val.sku ? val.sku : '-'}</td>
                                <td>${val.modelOption ? val.modelOption : '-'}</td>
                                <td>${val.modelSku ? val.modelSku : '-'}</td>
                                <td>${val.amount}</td>
                                ${idx === 0 ? ('<td rowspan="' + arr.length + '">' + item.total +'</td>') : ''}
                            </tr>`;
                }).join('')
            // + (item.bundleDeal 
            //     ? `
            //     <tr>
            //         <td colspan="6" style="text-align: center;">數量：${item.amount}，總金額：${item.total}</td>
            //     </tr>`
            //     : '')
        }).join('') + `
                </tbody>                    
            </table>
            <table class="detail-main-table">
                <tbody>
                    <tr>
                        <th>訂單金額</th>
                        <td>${detail.amount}</td>
                        <th>總數量</th>
                        <td>${detail.totalAmount}</td>
                    </tr>
                    <tr>
                        <th>運費</th>
                        <td>${detail.shippingFee}</td>
                        <th>實付金額</th>
                        <td>${detail.actualPrice}</td>
                    </tr>
                    <tr>
                        <td colspan="4">買家私訊：${detail.remark}</td>
                    </tr>
                    <tr>
                        <td colspan="4">賣家備註：${detail.note}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </td>`;

    return ele;
}

/**
 * 蝦皮全家
 */
const Jimp = require('jimp');
const Tesseract = require('tesseract.js');
Tesseract.setLogging(true);

function shopeeFormatFamilyMart(isFast, shipDetails) {
    const isFastTypesetting = isFast === 'true';
    const details = shipDetails ? JSON.parse(shipDetails) : '';
    const mainImg = Array.prototype.slice.call(document.querySelectorAll('img'));
    const imageArr = mainImg.map(i => i.src);
    confirmShipList(imageArr);

    function confirmShipList(imageArr) {
        document.querySelector('body>div').innerHTML = '載入中...';
        const asyncReadImg = async () => await Promise.all(imageArr.map(img => readImg(img)));
        asyncReadImg()
            .then(value => {
                const fileNameArr = (value.map(v => v.fileName)).flat();
                const imgIsHideArr = (value.map(v => v.imgIsHideArr)).flat();
                console.log(imgIsHideArr, fileNameArr);

                if (!details || isFastTypesetting) {
                    return { imgIsHideArr, traceNoArr: '' };
                }

                return getTextFromImage(imgIsHideArr, fileNameArr);
            }).then(value => {
                console.log(value);
                const { imgIsHideArr, traceNoArr } = value;
                formatShip(imageArr, imgIsHideArr, traceNoArr);
            });
    }

    function readImg(img) {
        return new Promise((resolve, reject) => {
            Jimp.read(img).then(image => {
                let imgIsHideArr = [];
                const divBackgroundPositionArr = [
                    { x: 250, y: 1200 },
                    { x: 1550, y: 1200 },
                    { x: 250, y: 3335 },
                    { x: 1550, y: 3335 }
                ];

                divBackgroundPositionArr.forEach(value => {
                    const rgba = Jimp.intToRGBA(image.getPixelColor(value.x, value.y));
                    const isHide = Object.values(rgba).every(v => v === 255);
                    console.log(rgba);
                    imgIsHideArr.push(isHide);
                });

                let fileName = '';
                if (details && !isFastTypesetting) {
                    const imgUrlArr = img.split('/');
                    fileName = './img/' + imgUrlArr[imgUrlArr.length - 1].replace('gif', 'jpg');
                    image.write(fileName);
                }
                resolve({ imgIsHideArr, fileName });
            })
                .catch(error => console.log(error));
        });
    }

    async function getTextFromImage(imgIsHideArr, fileNameArr) {
        const { createWorker, createScheduler } = Tesseract;
        const scheduler = createScheduler();
        const imgIsHideLength = imgIsHideArr.filter(img => !img).length;

        for (let i = 0; i < imgIsHideLength; i++) {
            const w = createWorker();
            await w.load();
            await w.loadLanguage('eng+chi_tra');
            await w.initialize('eng+chi_tra');
            scheduler.addWorker(w);
        }

        const rectangles = [
            {
                left: 172,
                top: 240,
                width: 680,
                height: 380
            },
            {
                left: 1480,
                top: 240,
                width: 680,
                height: 380,
            },
            {
                left: 172,
                top: 2375,
                width: 680,
                height: 380,
            },
            {
                left: 1480,
                top: 2375,
                width: 680,
                height: 380,
            }
        ];
        let imgSrcArr = [];
        let sizeArr = [];

        fileNameArr.forEach(item => {
            for (let i = 1; i <= 4; i++) {
                imgSrcArr.push(item);
            }
            sizeArr = sizeArr.concat(rectangles);
        });
        imgSrcArr.splice(imgIsHideLength, imgSrcArr.length - imgIsHideLength);
        sizeArr.splice(imgIsHideLength, sizeArr.length - imgIsHideLength);

        const textArr = await Promise.all(
            imgSrcArr.map((img, idx) => {
                console.log(img);
                console.log(sizeArr[idx]);
                return scheduler.addJob('recognize', img, { rectangle: sizeArr[idx] });
            })
        );
        const result = textArr.map(({ data: { text } }) => text);
        const traceNoArr = result.map(item => getTraceNo(item));
        await scheduler.terminate();
        return { imgIsHideArr, traceNoArr };
    }

    function getTraceNo(text) {
        console.log(text);
        const str = text.replace(/(\r\n|\n|\r)/gm, '').replace(/\s+/g, '');
        if (str.indexOf('訂單編號﹕') < 0) {
            return '';
        }

        const from = str.indexOf('訂單編號﹕') + 5;
        const length = 11;
        const traceNo = str.substr(from, length);
        return traceNo;
    }

    function formatShip(mainImgArr, imgIsHideArr, traceNoArr) {
        const divBackgroundPositionArr = [
            { x: 0, y: 0 },
            { x: -315, y: 0 },
            { x: 0, y: -515 },
            { x: -315, y: -515 }
        ];
        let divGroup = document.createElement('div');
        let imgSrcArr = [];
        let positionArr = [];

        mainImgArr.forEach(item => {
            for (let i = 1; i <= 4; i++) {
                imgSrcArr.push(item);
            }
            positionArr = positionArr.concat(divBackgroundPositionArr);
        });

        imgIsHideArr.forEach((isHide, idx) => {
            if (!isHide) {
                divGroup.innerHTML += `
                    <div style="width:310px;height:505px;background:url('${imgSrcArr[idx]}') ${positionArr[idx].x}px ${positionArr[idx].y}px / 627px 1023px no-repeat">
                    </div>
                    ${pagebreak}
                `;

                if (details) {
                    let detailEle;
                    let noteTraceNo;
                    if (isFastTypesetting) {
                        detailEle = generateDetailEle(details[idx]);
                    } else {
                        noteTraceNo = traceNoArr[idx];
                        detailEle = generateDetailEle(details.filter(d => d.traceNo === noteTraceNo)[0]);
                    }

                    divGroup.innerHTML += `<tr>${detailEle}</tr>${pagebreak}`;
                }
            }
        });

        document.querySelector('body>div').align = 'left';
        document.querySelector('body>div').innerHTML = divGroup.innerHTML;
        document.querySelector('.pagebreak-group:last-child').remove();
    }
}