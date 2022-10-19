const {
	app,
	BrowserWindow,
	Menu,
	shell,
	dialog,
	webContents,
	session,
	net,
	ipcMain,
} = require('electron');
const fs = require('fs');
const shopeeFormat = fs.readFileSync('./src/inject/shopee.js').toString();

let mainWindow;
let isPro;
let shopeeShipDetailApiData;
let shopeeShipDetails = '';

app.on('ready', () => {
	createMainWindow();
});

app.on('window-all-closed', () => {
	app.quit();
});

app.on('activate', () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createMainWindow();
	}
});

ipcMain.on('async-isPro', (event, arg) => {
	isPro = arg;
});

function createMainWindow() {
	//OCR：delete image folder of family mart
	if (fs.existsSync('./img')) {
		fs.rmdir('./img', { recursive: true }, (error) => {
			if (error) throw error;
		});
	}

	mainWindow = new BrowserWindow({
		width: 1440,
		height: 720,
		show: false,
		webPreferences: {
			nodeIntegration: true,
		},
	});

	// and load the index.html of the app.
	mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

	mainWindow.once('ready-to-show', () => {
		mainWindow.show();
	});

	mainWindow.on('closed', () => {
		mainWindow = null;
	});

	mainWindow.on('focus', () => {
		createMainWindowMenu();
	});

	mainWindow.on('blur', () => {
		createOtherWindowMenu();
	});

	mainWindowContentListener();
}

function mainWindowContentListener() {
	mainWindow.webContents.on(
		'new-window',
		(event, url, frameName, disposition, options) => {
			console.log('url:::' + url);
			if (url.includes('get_packing_list')) {
				Object.assign(options, { show: false });
			} else if (url.includes('get_waybill_list')) {
				Object.assign(options, { width: 720, height: 720 });
			} else {
				event.preventDefault();
			}
		}
	);

	session.defaultSession.on('will-download', (event, item, webContents) => {
		const filePath = app.getPath('downloads') + '\\' + item.getFilename();
		item.setSavePath(filePath);
		item.once('done', (event, state) => {
			if (state !== 'completed') {
				return dialog.showMessageBox({
					type: 'error',
					title: '電商印單小幫手',
					message: '下載檔案錯誤',
				});
			}

			shell.showItemInFolder(filePath);
		});
	});

	// need generate shopee ship detail
	const filter = {
		urls: [
			'https://seller.shopee.tw/api/v3/order/get_order_list_by_order_ids/*',
		],
	};
	session.defaultSession.webRequest.onBeforeSendHeaders(
		filter,
		(details, callback) => {
			shopeeShipDetails = '';
			shopeeShipDetailApiData = details;
			callback({ requestHeaders: details.requestHeaders });
		}
	);
}

function createMainWindowMenu() {
	const menus = [
		{
			label: '工具',
			submenu: [
				{
					label: '上一頁',
					click: () => webContents.getFocusedWebContents().goBack(),
					accelerator: 'Alt + Left',
				},
				{
					label: '下一頁',
					click: () => webContents.getFocusedWebContents().goForward(),
					accelerator: 'Alt + Right',
				},
				{
					label: '重新載入',
					role: 'reload',
					accelerator: 'CmdOrCtrl + R',
				},
				{
					type: 'separator',
				},
				{
					label: '檢查',
					role: 'toggledevtools',
					accelerator: 'CmdOrCtrl + Shift + I',
				},
			],
		},
		{
			label: '功能',
			submenu: [
				{
					label: '序號驗證',
					click: () => {
						const option = {
							type: 'question',
							buttons: ['確認', '取消'],
							defaultId: 1,
							title: '電商印單小幫手',
							message: '將會重新驗證序號',
						};

						dialog.showMessageBox(option).then((results) => {
							if (results.response === 1) {
								return;
							}

							isPro = undefined;
							webContents
								.getFocusedWebContents()
								.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
						});
					},
				},
				{
					type: 'separator',
				},
				{
					label: '產生出貨明細',
					click: () => generateShopeeShipDetail(),
				},
			],
		},
		{
			label: '幫助',
			submenu: [
				{
					label: '關於',
					click: () =>
						shell.openExternal('https://alexfan.1shop.tw/shopeefastprint'),
					accelerator: 'CmdOrCtrl + Shift + H',
				},
			],
		},
	];

	const m = Menu.buildFromTemplate(menus);
	Menu.setApplicationMenu(m);
}

function createOtherWindowMenu() {
	const menus = [
		{
			label: '工具',
			submenu: [
				{
					label: '重新載入',
					role: 'reload',
					accelerator: 'CmdOrCtrl + R',
				},
				{
					type: 'separator',
				},
				{
					label: '檢查',
					role: 'toggledevtools',
					accelerator: 'CmdOrCtrl + Shift + I',
				},
			],
		},
		{
			label: '功能',
			submenu: [
				{
					label: '排版',
					id: 'general',
					click: (menuItem) => {
						menuItem.enabled = false;
						Menu.getApplicationMenu().getMenuItemById('fast').enabled = false;
						typesetting(false);
					},
				},
				{
					label: '快速排版 （只適用直接全選訂單）',
					id: 'fast',
					click: (menuItem) => {
						menuItem.enabled = false;
						Menu.getApplicationMenu().getMenuItemById(
							'general'
						).enabled = false;
						typesetting(true);
					},
				},
				{
					label: '列印',
					click: () => {
						const today = new Date().toISOString().slice(0, 10);
						const title = webContents.getFocusedWebContents().getTitle();
						const filePath =
							app.getPath('downloads') + '\\' + title + '_' + today + '.pdf';
						const options = {
							marginsType: 1,
							printBackground: false,
							pageSize: 'A5',
						};
						webContents
							.getFocusedWebContents()
							.printToPDF(options)
							.then((data) => {
								fs.writeFile(filePath, data, (error) => {
									if (error) throw error;
									shell.openItem(filePath);
								});
							})
							.catch((error) => console.log(error));
					},
				},
			],
		},
		{
			label: '幫助',
			submenu: [
				{
					label: '關於',
					click: () =>
						shell.openExternal('https://alexfan.1shop.tw/shopeefastprint'),
					accelerator: 'CmdOrCtrl + Shift + H',
				},
			],
		},
	];

	const m = Menu.buildFromTemplate(menus);
	Menu.setApplicationMenu(m);
}

function generateShopeeShipDetail() {
	if (isPro === undefined) {
		return dialog.showMessageBox({
			type: 'error',
			title: '電商印單小幫手',
			message: '請先驗證序號',
		});
	}

	if (!isPro) {
		return dialog.showMessageBox({
			type: 'error',
			title: '電商印單小幫手',
			message: '需要升級方案喔',
		});
	}

	const url = webContents.getFocusedWebContents().getURL();
	if (
		(url.indexOf('seller.shopee.tw') > -1 &&
			url.indexOf('type=print') === -1) ||
		!shopeeShipDetailApiData
	) {
		shopeeShipDetailApiData = null;
		return dialog.showMessageBox({
			type: 'error',
			title: '電商印單小幫手',
			message: '請至下載出貨文件勾選需產生出貨明細的商品',
		});
	}

	const request = net.request({
		method: 'GET',
		url: shopeeShipDetailApiData.url,
		headers: shopeeShipDetailApiData.requestHeaders,
	});

	request.on('response', (response) => {
		shopeeShipDetails = '';
		response.on('data', (chunk) => {
			const json = chunk.toString('utf-8');
			const obj = json ? JSON.parse(json) : [];
			let results = obj.data.orders.map((res) => ({
				orderSn: res.order_sn,
				buyerInfo:
					res.buyer_address_name +
					'（' +
					res.buyer_user.user_name +
					'）, ' +
					res.buyer_address_phone,
				shippingAddr: res.shipping_address,
				amount: parseFloat(res.total_price) - parseFloat(res.shipping_fee),
				shippingFee: parseFloat(res.shipping_fee),
				actualPrice: parseFloat(res.total_price),
				remark: res.remark,
				note: res.note,
				traceNo: res.shipping_traceno,
				totalAmount: res.order_items
					.map((item) => {
						const arr = item.item_list.map((val) => val.amount);
						return item.item_list.length ? arr.flat() : item.amount;
					})
					.flat()
					.reduce((a, b) => a + b),
				items: res.order_items.map((item) => ({
					name: item.product.name,
					modelOption: item.item_model.name,
					modelSku: item.item_model.sku,
					sku: item.product.sku,
					price: parseFloat(item.item_price),
					amount: item.amount,
					total: parseFloat(item.item_price) * item.amount,
					bundleDeal: item.bundle_deal
						? item.bundle_deal.labels[0].value
						: null,
					itemList: item.item_list.map((val, idx) => ({
						name: item.bundle_deal_product[idx].name,
						modelOption: item.bundle_deal_model[idx].name,
						modelSku: item.bundle_deal_model[idx].sku,
						sku: item.bundle_deal_product[idx].sku,
						price: parseFloat(val.item_price),
						amount: val.amount,
						total: parseFloat(val.item_price) * val.amount,
					})),
				})),
			}));

			console.log(results);
			shopeeShipDetails = JSON.stringify(results);
			dialog.showMessageBox({
				type: 'none',
				title: '電商印單小幫手',
				message: '明細取得成功，請開啟寄件單頁面進行排版',
			});
		});
	});
	request.end();
}

function typesetting(isFast) {
	const shopName = webContents.getFocusedWebContents().getURL();
	console.log(shopName);

	webContents.getFocusedWebContents().insertCSS(`
                @media print { 
                  * { -webkit-print-color-adjust: exact !important; }
                  .pagebreak { page-break-after: always; } 
                }
                .detail-div { font-family: 'Segoe UI','微軟正黑體', monospace;font-size: 14px;width: 330px;padding: 5px 15px; }
                .detail-div table { border-collapse: collapse;width: 100%; }
                .detail-div table td , .detail-div table tr th{ border: 1px solid #a8a8a8; }
                .detail-div .detail-main-table th { width: 4em; }
              `);

	switch (true) {
		case shopName.includes('7-11'):
			webContents
				.getFocusedWebContents()
				.executeJavaScript(
					`${shopeeFormat}shopeeFormat711('${shopeeShipDetails}');`
				);
			break;
		case shopName.includes('hilife'):
			webContents
				.getFocusedWebContents()
				.insertCSS(
					`.style1 { width:unset !important; height:unset !important; } .detail-div { padding: 0; }`
				);
			webContents
				.getFocusedWebContents()
				.executeJavaScript(
					`${shopeeFormat}shopeeFormatHilife('${shopeeShipDetails}');`
				);
			break;
		case shopName.includes('familymart'):
			webContents
				.getFocusedWebContents()
				.executeJavaScript(
					`${shopeeFormat}shopeeFormatFamilyMart('${isFast}','${shopeeShipDetails}');`
				);
			break;
	}

	shopeeShipDetails = '';
}
