import { ref, reactive } from "vue";
import * as utils from "@/utils/utils.js";

export function useOrderDialog(selectRow = null) {
  // 訂貨單的小視窗

  const isCallOrderDialogVisible = ref(false); // 調用訂單介面(CallOrderDialog)是否顯示
  const orderQuery = reactive({ danno: "", spno: "", spspec: "", status: "" }); // 用來存儲調用訂單介面(CallOrderDialog)的訂單查詢條件
  const orders = ref([]); // 用來存儲從API獲取的訂單資料 也就是調用訂單介面(CallOrderDialog)裡的訂單列表
  const orderFiltered = ref([]); // 用來存儲過濾後的訂單列表 顯示於調用訂單介面(CallOrderDialog)

  async function openCallOrdersDialog(supplyno, item = null) {
    // 打開調用訂單介面(CallOrderDialog)

    if (selectRow !== null) {
      selectRow.value = item; // 直接點選表格中的...按鈕時，儲存選取的行
    }

    // 每次調用訂單對話框打開時，需清空查詢欄位，否則會殘留前次輸入的內容
    orderQuery.danno = "";
    orderQuery.spno = "";
    orderQuery.spspec = "";
    orderQuery.status = "pending"; // 預設查詢狀態為未完成

    // 調用訂單查詢
    if (!supplyno) {
      console.error("供方編碼為空");
    } else {
      const params = {
        supplyno: supplyno,
      };

      orders.value = await utils.fetchData("callOrder.php", params);
      console.log("調用訂單查詢結果：", orders.value);

      // 轉換成規範的型態
      for (let order of orders.value) {
        order["header.cldhditm.dhdpcs"] = parseInt(
          order["header.cldhditm.dhdpcs"]
        );
        order["header.cldhditm.getpcs"] = parseFloat(
          order["header.cldhditm.getpcs"]
        );
        order["header.NA.notpcs"] = parseFloat(order["header.NA.notpcs"]);
        order["header.cldhditm.jzpcs"] = parseFloat(
          order["header.cldhditm.jzpcs"]
        );
        order["header.cldhditm.price"] = parseFloat(
          order["header.cldhditm.price"]
        );
        order["NA.sp.dz"] = parseFloat(order["NA.sp.dz"]);
        try {
          order["header.cldhditm.gdate"] =
            order["header.cldhditm.gdate"].date.split(" ")[0];
        } catch (error) {
          // 處理日期格式錯誤的情況
          order["header.cldhditm.gdate"] = null; // 或者設置為其他預設值
          console.error("日期格式錯誤", error);
        }
      }
    }

    handleInputOrderQuery(); // 初始化訂單列表
    isCallOrderDialogVisible.value = true; // 打開調用訂單介面
  }

  function handleInputOrderQuery() {
    // 處理調用訂單介面(CallOrderDialog)的查詢條件, 根據查詢條件過濾訂單列表
    let ordersStatusFiltered = orders.value;

    if (orderQuery.status === "pending") {
      // 如果查詢狀態為未完成，則只顯示未完成的訂單
      ordersStatusFiltered = orders.value.filter(
        (order) =>
          order["header.cldhditm.getpcs"] + order["header.cldhditm.jzpcs"] <
          order["header.cldhditm.dhdpcs"]
      );
    } else if (orderQuery.status === "completed") {
      // 如果查詢狀態為已完成，則只顯示已完成的訂單
      ordersStatusFiltered = orders.value.filter(
        (order) =>
          order["header.cldhditm.getpcs"] + order["header.cldhditm.jzpcs"] >=
          order["header.cldhditm.dhdpcs"]
      );
    }

    if (
      orderQuery["danno"].trim() === "" &&
      orderQuery["spno"].trim() === "" &&
      orderQuery["spspec"].trim() === ""
    ) {
      orderFiltered.value = ordersStatusFiltered;
    } else {
      orderFiltered.value = ordersStatusFiltered.filter(
        (order) =>
          (orderQuery["danno"].trim() === "" ||
            (order["header.cldhditm.danno"] &&
              order["header.cldhditm.danno"]
                .toUpperCase()
                .includes(orderQuery["danno"].toUpperCase()))) &&
          (orderQuery["spno"].trim() === "" ||
            (order["header.cldhditm.spno"] &&
              order["header.cldhditm.spno"]
                .toUpperCase()
                .includes(orderQuery["spno"].toUpperCase()))) &&
          (orderQuery["spspec"].trim() === "" ||
            (order["header.sp.spspec"] &&
              order["header.sp.spspec"]
                .toUpperCase()
                .includes(orderQuery["spspec"].toUpperCase())))
      );
    }
  }

  return {
    isCallOrderDialogVisible,
    orderQuery,
    orderFiltered,
    openCallOrdersDialog,
    handleInputOrderQuery,
  };
}
