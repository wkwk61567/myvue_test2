// utils.js
import { API_BASE_URL } from "@/config";
import axios from "axios";
import * as XLSX from "xlsx";

export function sleep(ms) {
  // 測試用 可以用await sleep(1000) 來暫停1秒
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function auditOrder(isAudit, params) {
  // 審核(反審核)
  const flagType = isAudit ? "auditflag" : "unauditflag";
  const apiEndpoint = isAudit ? "auditOrder.php" : "unauditOrder.php";
  const actionText = isAudit ? "審核" : "反審核";

  // 檢查權限
  try {
    const hasPermission = await checkFlag(flagType, params.formno);
    if (!hasPermission) {
      alert(`沒有${actionText}權限`);
      return;
    }

    // 確認操作
    if (!confirm(`您確定要${actionText}嗎?`)) {
      return;
    }

    console.log(`${actionText}:`, params.danno);

    const response = await fetch(`${API_BASE_URL}/api/${apiEndpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // 憑證
      body: JSON.stringify(params),
    });

    const data = await response.json();
    console.log(`${actionText}結果:`, data);
  } catch (error) {
    console.error(`${actionText}失敗`, error);
    alert(`${actionText}操作失敗：${error.message}`);
  }
}

export function handleField(
  item,
  field,
  decimalPlaces = 4,
  isSetNegativeToZero = true
) {
  // 轉換成規範的數字

  let numericValue = parseFloat(item[field]) || 0; // 轉換成數字

  if (isSetNegativeToZero && numericValue < 0) {
    numericValue = 0; // 如果小於0，則設為0
  }

  numericValue = parseFloat(numericValue.toFixed(decimalPlaces)); // 四捨五入到小數點後指定位數 #BusinessLogic

  item[field] = numericValue; // 更新數值
}

export async function fetchCategories() {
  // 獲取收貨類別
  try {
    const response = await fetch(`${API_BASE_URL}/api/spkind.php`);
    const data = await response.json();
    const spkindnoOptions = data.map((item) => ({
      spkindno: item.spkindno,
      spkindname: item.spkindname,
    }));
    return spkindnoOptions; // 回傳供方類別選項
  } catch (error) {
    console.error("獲取收貨類別失敗", error);
    return []; // 返回空數組以防錯誤
  }
}

export async function fetchCkkindOptions(spkindname, spkindnoOptions) {
  // 獲取倉庫類別選項
  console.log("供方類別:", spkindname);
  const selectedCategory = spkindnoOptions.find(
    (item) => item.spkindname === spkindname
  );
  const spkindno = selectedCategory ? selectedCategory.spkindno : null;

  console.log("倉庫類別查詢", spkindno);
  const ckkindParams = {
    spkindno: spkindno,
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/ckkind.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ckkindParams),
    });
    const data = await response.json();
    console.log("倉庫類別選項查詢結果：", data);
    const ckkindOptions = data.map((item) => ({
      ckkind: item,
    }));
    console.log("test 倉庫類別選項：", ckkindOptions);
    return ckkindOptions; // 回傳倉庫類別選項
  } catch (error) {
    console.error("獲取倉庫類別選項失敗", error);
    return []; // 返回空數組以防錯誤
  }
}

export function filterSuppliers(suppliers, supplyQuery, tempSupplykind) {
  // 根據查詢條件過濾供方列表
  let filteredSuppliers = suppliers; // 初始化過濾列表為所有供方
  if (supplyQuery.trim() !== "") {
    const queryUpper = supplyQuery.toUpperCase(); // 將查詢條件轉換為大寫類別查詢條件轉換為大寫
    filteredSuppliers = suppliers.filter(
      (supplier) =>
        supplier["header.supply.supplyno"].toUpperCase().includes(queryUpper) ||
        supplier["header.supply.supplyname"].toUpperCase().includes(queryUpper)
    );
  }
  if (tempSupplykind.trim() !== "") {
    const tempSupplykindUpper = tempSupplykind.toUpperCase(); // 將供方類別查詢條件轉換為大寫
    filteredSuppliers = filteredSuppliers.filter(
      (supplier) =>
        supplier["header.supply.supplykind"]?.toUpperCase() ===
        tempSupplykindUpper
    );
  }
  return filteredSuppliers; // 回傳過濾後的供方列表
}

export async function checkFlag(requiredFlag, requiredFormno) {
  // 應該改叫isFlagTrue
  // 檢查權限
  try {
    const response = await axios.get(`${API_BASE_URL}/api/checkFlag.php`, {
      withCredentials: true,
      params: {
        flag: requiredFlag,
        formno: requiredFormno,
      },
    });
    const user = response.data;

    if (requiredFlag && user.flag !== 1) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("error", error);
    return false;
  }
}

export function getApiUrl(apiFileName) {
  return `${API_BASE_URL}/api/${apiFileName}`;
}

export async function fetchData(apiFileName, params) {
  // 通用的API請求函數
  console.log(`傳送至:${apiFileName}, 參數:`, params);
  try {
    const response = await fetch(`${API_BASE_URL}/api/${apiFileName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // 憑證
      body: JSON.stringify(params),
    });
    return await response.json();
  } catch (error) {
    console.error(`${apiFileName}失敗:`, error);
    return null;
  }
}

export function calculateColumnSum(results, columnKey) {
  // 計算欄位的加總
  const sum = results.reduce((total, item) => {
    return total + (parseFloat(item[columnKey]) || 0);
  }, 0);
  return parseFloat(sum.toFixed(6)); // 避免浮點數誤差
}

export function getCurrentDateTime() {
  // 獲取當前日期和時間
  const now = new Date(); // 取得當前時間
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0"); // 月份是從0開始的，所以加1
  const day = String(now.getDate()).padStart(2, "0"); // 確保日期是2位數
  const date = `${year}-${month}-${day}`; // 設定日期格式為 yyyy-mm-dd
  const hours = String(now.getHours()).padStart(2, "0"); // 格式化為2位數
  const minutes = String(now.getMinutes()).padStart(2, "0"); // 格式化為2位數
  const time = `${hours}:${minutes}`; // 設定時間
  return [date, time]; // 返回日期和時間
}

export function isReadonly(mode, inputType, isEditable, componentType) {
  //是否唯讀
  return (
    mode === "view" ||
    (mode === "add" &&
      inputType !== "inputable" &&
      !(inputType === "optional" && componentType === "select")) ||
    (mode === "edit" && !isEditable)
  );
}

export function formatDateTimeFields(results, labels) {
  // 轉換日期和時間欄位
  results.forEach((item) => {
    // 根據dataType來決定如何處理時間格式
    for (let key in item) {
      if (labels[key]?.dataType === "date") {
        // 如果是日期類型，則切割成 yyyy-mm-dd 格式
        item[key] = item[key] ? item[key].date.split(" ")[0] : "";
      } else if (labels[key]?.dataType === "datetime") {
        // 如果是日期時間類型，則切割成 yyyy-mm-dd hh:mm:ss 格式
        item[key] = item[key] ? item[key].date.split(".")[0] : "";
      }
    }
  });
}

export function exportExcel(data, headers, name = "export") {
  console.log("exportExcel:", data, headers, name);
  // 將資料轉換為適合導出的格式
  const dataToExport = data.map((row) => {
    let newRow = {};
    headers.forEach((header) => {
      newRow[header.title] = row[header.key]; // 根據 key 取值並用 title 作為新鍵名
    });
    return newRow;
  });

  // 建立工作簿和工作表
  const worksheet = XLSX.utils.json_to_sheet(dataToExport, {
    skipHeader: false,
  });

  // 設置凍結窗格(無效)
  //worksheet["!freeze"] = { xSplit: 0, ySplit: 1 };
  //console.log("worksheet:", worksheet);

  // 建立工作簿並附加工作表
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, name);

  // 導出文件
  XLSX.writeFile(workbook, `${name}.xlsx`);
}

export async function handleUrlParams(setMode) {
  //檢查 URL 參數，自動切換到對應的模式，並從 URL 中移除 mode 參數
  const urlParams = new URLSearchParams(window.location.search);
  const modeParam = urlParams.get("mode");
  if (modeParam) {
    if (modeParam === "add" || modeParam === "edit") {
      await setMode(modeParam); // 切換到新增或編輯模式
    }
    // 從 URL 中刪除 mode 參數
    const urlCurrent = new URL(window.location);
    urlCurrent.searchParams.delete("mode");
    window.history.replaceState({}, "", urlCurrent);
  }
}

export function selectCellText(event) {
  // 選取表格中的文字

  const cell = event.target;

  // 清除現有選取
  window.getSelection().removeAllRanges();

  // 創建新的選取範圍
  const range = document.createRange();
  range.selectNodeContents(cell);

  // 應用選取
  const selection = window.getSelection();
  selection.addRange(range);
}

export async function printCldhdOrder(danno) {
  // 列印

  const data = await fetchData("cldhdDetails.php", { danno: danno });
  const supplyno = data["form"][0]["supplyno"];
  const ddate = data["form"][0]["ddate"].date.split(" ")[0];

  const xtsetupData = await fetchData("xtsetup.php", {});
  const company = {
    compname: xtsetupData[0]["compname"], // 東莞萬成模具五金制品有限公司
    compphone: xtsetupData[0]["compphone"], // TEL
    compaddress: xtsetupData[0]["compaddress"], // 地址
  };

  const supplyData = await fetchData("supply.php", { supplyno: supplyno });
  const supplier = {
    supplyname: supplyData[0]["supplyname"],
    address: supplyData[0]["address"],
    phone: supplyData[0]["phone"],
    fax: supplyData[0]["fax"],
    contact: supplyData[0]["contact"],
    payno: supplyData[0]["payno"],
    payday: supplyData[0]["payday"],
  };

  const maxRowsPerPage = 7; // 每頁最大行數
  const totalItems = data["table"].length;
  const totalPages =
    totalItems === 0 ? 1 : Math.ceil(totalItems / maxRowsPerPage);
  let pagesContent = "";

  for (let page = 1; page <= totalPages; page++) {
    const startIndex = (page - 1) * maxRowsPerPage;
    const endIndex = startIndex + maxRowsPerPage;
    const pageItems = data["table"].slice(startIndex, endIndex);

    const itemsHtml = pageItems
      .map(
        (item, index) => `
      <tr>
        <td style="text-align: center;">${startIndex + index + 1}</td>
        <td>${item["header.cldhditm.spno"] || ""}</td>
        <td>${item["header.sp.spspec"] || ""}</td>
        <td style="text-align: center;">${item["header.sp.spunit"] || ""}</td>
        <td style="text-align: right;">${item["header.cldhditm.pcs"] || ""}</td>
        <td style="text-align: right;">${item["header.cldhditm.kg"] || ""}</td>
        <td style="text-align: right;">${
          item["header.cldhditm.price"] || ""
        }</td>
        <td style="text-align: right;">${item["header.cldhditm.pay"] || ""}</td>
        <td style="text-align: center;">${
          item["header.cldhditm.gdate"].date.split(" ")[0] || ""
        }</td>
        <td>${item["header.cldhditm.note"] || ""}</td>
      </tr>
    `
      )
      .join("");

    let emptyRowsHtml = "";
    const rowsOnThisPage = pageItems.length;

    // 用空白行填滿
    for (let i = 0; i < maxRowsPerPage - rowsOnThisPage; i++) {
      emptyRowsHtml +=
        "<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>";
    }

    // 每頁都計算從第一筆到本頁最後一筆的合計
    const pageSum = data["table"]
      .slice(0, endIndex)
      .reduce(
        (total, item) => total + (parseFloat(item["header.cldhditm.pay"]) || 0),
        0
      );
    const formattedPageSum = parseFloat(pageSum.toFixed(2));

    const tfootHtml = `
      <tfoot>
        <tr>
          <td style="width: 4%;" class="text-right"></td>
          <td colspan="4"></td>
          <td class="text-right" style="white-space: nowrap;">合計：</td>
          <td class="text-right" style="white-space: nowrap;">${formattedPageSum}</td>
          <td colspan="7"></td>
        </tr>
      </tfoot>
    `;

    pagesContent += `
      <div class="page-container">
        <div class="header-content">
          <div class="header">
            <h1>${company.compname}</h1>
            <p>${company.compphone}</p>
            <p>${company.compaddress}</p>
          </div>
          
          <table style="width: 100%;">
            <tr>
              <td style="width: 40%;"><b>訂單號碼：</b>${danno}</td>
              <td style="width: 20%; font-size: 16pt;"><div class="title">內 銷 訂 購 單</div></td>
              <td style="width: 40%;" class="text-right"><b>訂購日期：</b>${ddate}</td>
            </tr>
          </table>

          <table class="info-table">
            <tr>
              <td style="width: 10%;"><b>廠商名稱</b></td>
              <td style="width: 25%;">${supplier.supplyname}</td>
              <td style="width: 10%;"><b>聯絡人</b></td>
              <td style="width: 20%;">${supplier.contact}</td>
              <td style="width: 10%;"><b>傳真</b></td>
              <td style="width: 25%;">${supplier.fax}</td>
            </tr>
            <tr>
              <td><b>廠商地址</b></td>
              <td>${supplier.address}</td>
              <td><b>電話</b></td>
              <td>${supplier.phone}</td>
              <td><b>幣別</b></td>
              <td>${supplier.payno}</td>
            </tr>
          </table>
        </div>

        <table class="main-table items-table">
          <thead>
            <tr>
              <th style="width: 4%; white-space: nowrap;">項目</th>
              <th style="width: 15%;">編碼</th>
              <th style="width: 31%;">規格</th>
              <th style="width: 6%;">單位</th>
              <th style="width: 6%;">數量</th>
              <th style="width: 6%;">重量</th>
              <th style="width: 6%;">單價</th>
              <th style="width: 6%;">金額</th>
              <th style="width: 10%;">交貨日期</th>
              <th style="width: 10%;">用途</th>
            </tr>
          </thead>
          <tbody style="font-size: 8pt;">
            ${itemsHtml}
            ${emptyRowsHtml}
          </tbody>
          ${tfootHtml}
        </table>

        <div class="footer-content">
          <table class="footer-table" style="width: 100%;">
            <tr>
              <td style="width: 5%; white-space: nowrap;">核准</td>
              <td style="width: 20%;"></td>
              <td style="width: 5%; white-space: nowrap;">審核</td>
              <td style="width: 20%;"></td>
              <td style="width: 5%; white-space: nowrap;">主管</td>
              <td style="width: 20%;"></td>
              <td style="width: 5%; white-space: nowrap;">采購</td>
              <td style="width: 20%;"></td>
            </tr>
          </table>

          <div class="notes">
            <b>說明：</b>
            <ol style="margin: 0; padding-left: 40px;">
              <li>付款條件：月結 ${supplier.payday} 天。</li>
              <li>訂單請于隔天簽回，否則視同默認. 造成一切後果由貴司承擔.</li>
              <li>此材料為HSF材料</li>
            </ol>
          </div>

          <div class="bottom-bar">
            <span>Q-4-10-03-A01</span>
            <span>第 ${page} 頁 / 共 ${totalPages} 頁</span>
            <span>廠商回復__________________</span>
          </div>
        </div>
      </div>
    `;
  }

  const htmlContent = `
    <html>
      <head>
        <title>內銷訂購單 - ${danno}</title>
        <style>
          @media print {
            body { -webkit-print-color-adjust: exact; }
          }
          body { font-family: 'PMingLiU'; margin: 0; }
          .page-container {
            flex-direction: column;
            justify-content: space-between;
            height: 100%;
            page-break-after: always;
          }
          .page-container:last-child {
            page-break-after: auto;
          }
          .header-content, .footer-content {
            flex-shrink: 0;
          }
          table { width: 100%; border-collapse: collapse; font-size: 9pt; }
          .main-table, .main-table th {
            border: 1px solid black;
          }
          .main-table td, .main-table tbody td, .main-table tfoot td {
            border: none;
          }
          .main-table td:first-child, .main-table th:first-child {
            border-left: 1px solid black;
            border-right: 1px solid black;
          }
          .main-table th, .main-table td { padding: 0px; padding-left: 5px; border-left: none; border-right: none;}
          .header { font-family: '宋体', 'SimSun', sans-serif; text-align: center; }
          .header h1 { font-size: 16pt; margin: 0; }
          .header p { margin: 0; font-size: 9pt; }
          .title { text-align: center; font-size: 16pt; font-weight: bold; padding: 5px 0; }
          .info-table td { border: 1px solid black; padding: 3px; vertical-align: middle; }
          .items-table th { text-align: center; }
          .items-table td { vertical-align: top; height: 22px; } /* Set fixed height for rows */
          .footer-table td { border: 1px solid black; padding-top: 10px; padding-bottom: 10px; }
          .notes { font-size: 9pt; }
          .bottom-bar { display: flex; justify-content: space-between; font-size: 9pt; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
        </style>
      </head>
      <body>
        ${pagesContent}
      </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  printWindow.document.write(htmlContent);
  //return;
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
}

export async function readExcel(event) {
  // 讀取excel
  const file = event.target.files[0];
  if (!file) return [];
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      // 轉成二維陣列
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      if (rows.length < 2) return resolve([]);
      const headers = rows[0];
      const result = rows.slice(1).map((row) => {
        const obj = {};
        headers.forEach((key, idx) => {
          let value = row[idx] ?? "";
          // 自動判斷交貨日期欄位，若為數字則轉日期字串
          if (key.includes("交貨日期") && typeof value === "number") {
            // Excel 日期序號轉 JS 日期
            const date = XLSX.SSF.parse_date_code(value);
            if (date) {
              value = `${date.y}/${date.m}/${date.d}`;
            }
          }
          obj[key] = value;
        });
        return obj;
      });
      resolve(result);
    };
    reader.onerror = reject; // 如果讀取失敗，則回傳錯誤資訊
    reader.readAsArrayBuffer(file);
  });
}