<!-- 采購訂單導入頁面 -->
<template>
  <v-container style="max-width: none">
    <ButtonsCRUDP
      :query="query"
      :isQueryDisabled="false"
      :deleteOrder="deleteOrder"
      :isDeleteOrderDisabled="isDeleteOrderDisabled"
      :exportExcel="() => utils.exportExcel(displayResults, headers, '采購訂單導入', '采購訂單導入')"
      :isExportExcelDisabled="isExportExcelDisabled"
      :importExcel="importExcel"
      :isImportExcelDisabled="isImportExcelDisabled"
      :makeCldhd="makeCldhd"
      :isMakeCldhdDisabled="isMakeCldhdDisabled"
    />
    <!-- form區塊 -->
    <v-card>
      <v-card-title>資料庫查詢</v-card-title>
      <v-card-text>
        <v-row v-for="(row, rowIdx) in formRows" :key="rowIdx">
          <template v-for="field in row" :key="field.column">
            <v-col :cols="field.cols">
              <template v-if="field.componentType === 'button'">
                <!-- 目前這個頁面沒有用到 -->
                <v-btn
                  color="primary"
                  width="100%"
                  height="56px"
                  :disabled="field.disabled ? field.disabled() : false"
                  @click="field.onClick"
                >
                  {{ field.name }}
                </v-btn>
              </template>
              <template v-else-if="field.componentType === 'icon-text-field'">
                <v-text-field
                  v-model="form[field.column]"
                  :append-inner-icon="field.icon"
                  @click:append-inner="field.onClick"
                >
                <template #prepend>
                  <span class="prepend-label">{{field.name}}</span>
                </template>
                </v-text-field>
              </template>
              <template v-else>
                <component
                  :is="
                    field.componentType === 'checkbox'
                      ? 'v-checkbox'
                      : field.componentType === 'select'
                      ? 'v-select'
                      : 'v-text-field'
                  "
                  v-model="form[field.column]"
                  v-bind="
                    field.componentType === 'select'
                      ? {
                          'item-title': field.column,
                          'item-value': field.column,
                          items: formSelectOptions[field.column].value,
                        }
                      : field.componentType === 'date'
                      ? { type: 'date' }
                      : {}
                  "
                >
                <template #prepend>
                  <span class="prepend-label" >{{field.name}}</span>
                </template>
              </component>
              </template>
            </v-col>
          </template>
        </v-row>
        <v-radio-group
          v-model="form.dhdnoStatus"
        >
          <v-row  style="margin: 20px 0px 0px 0px">
            <v-radio
              :label="labels['filter.NA.revert'].name"
              value=""
            ></v-radio>
            <v-radio
              :label="labels['filter.NA.completed'].name"
              value="completed"
            ></v-radio>
            <v-radio
              :label="labels['filter.NA.pending'].name"
              value="pending"
            ></v-radio>
          </v-row>
        </v-radio-group>
        <!-- 供方的小視窗 -->
        <SupplyDialog
          :dialog="dialog"
          @update:dialog="dialog = $event"
          :supplyQuery="supplyQuery"
          @update:supplyQuery="supplyQuery = $event"
          :tempSupplykind="tempSupplykind"
          @update:tempSupplykind="tempSupplykind = $event"
          :spkindnoOptionsWithEmpty="spkindnoOptionsWithEmpty"
          :filteredSuppliers="filteredSuppliers"
          @handleInputSupplyQueryAndTempSupplykind="
            handleInputSupplyQueryAndTempSupplykind
          "
          @selectSupplier="selectSupplier"
        ></SupplyDialog>
        <!-- 材料的小視窗 -->
        <SpDialog
          :isSpDialogVisible="isSpDialogVisible"
          @update:isSpDialogVisible="isSpDialogVisible = $event"
          :spQuery="spQuery"
          @update:spQuery[spno]="spQuery.spno = $event"
          @update:spQuery[spspec]="spQuery.spspec = $event"
          @update:spQuery[matno]="spQuery.matno = $event"
          @update:spQuery[spunit]="spQuery.spunit = $event"
          @update:spQuery[spkindname]="spQuery.spkindname = $event"
          :spFiltered="spFiltered"
          @handleInputSpQuery="
            handleInputSpQuery
          "
          @selectSp="selectSp"
        ></SpDialog>
      </v-card-text>
    </v-card>

    <!-- 查詢結果顯示區塊：自定義 header 插槽 -->
    <v-card class="mt-4 table-scroll-card">
      <v-card-title>查詢結果</v-card-title>
      <v-data-table
        :headers="headers"
        :items="displayResults"
        no-data-text="No data available"
        :items-per-page="25"
        style="min-width: 1200px; max-height: 1200px; overflow-y: auto"
        fixed-header
        height="400px"
      >
        <template v-slot:header="{ headers }">
          <thead>
            <tr>
              <th v-for="header in headers" :key="header.key">
                {{ header.title }}
              </th>
            </tr>
          </thead>
        </template>

        <!-- 自定義每一行資料 -->
        <template v-slot:item="{ item }">
          <v-hover v-slot:default="{ isHovering, props: hoverProps }">
            <tr
              v-bind="hoverProps"
              @click="selectRow(item)"
              :style="
                isRowSelected(item['header.cldhddr.danno'])
                  ? { backgroundColor: SELECTED_COLOR }
                  : isHovering
                  ? { backgroundColor: HOVER_COLOR }
                  : {}
              "
            >
              <template v-for="header in headers" :key="header.key">
                <td v-if="labels[header.key].componentType === 'checkbox'">
                  <v-checkbox
                    :model-value="item[header.key] === 1"
                    disabled
                  ></v-checkbox>
                </td>
                <td
                  v-else
                  :class="
                    labels[header.key]?.dataType === 'number' ? 'number-td' : ''
                  "
                  @click="utils.selectCellText($event)"
                >
                  {{ item[header.key] }}
                </td>
              </template>
            </tr>
          </v-hover>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, reactive, computed, onMounted, inject } from "vue";
import { HOVER_COLOR, SELECTED_COLOR } from "@/config.js";
import * as utils from "@/utils/utils.js";
import ButtonsCRUDP from "@/components/ButtonsCRUDP.vue";
import SupplyDialog from "@/components/SupplyDialog.vue";
import SpDialog from "@/components/SpDialog.vue";
import { useI18nHeadersLabels } from "@/composables/useI18nHeadersLabels.js";
import { useCheckButtonFlags } from "@/composables/useCheckButtonFlags.js";
import { useSupplyDialog } from "@/composables/useSupplyDialog.js";
import { useSelectRow } from "@/composables/useSelectRow.js";

const selectedLanguage = inject("selectedLanguage"); // 接收selectedLanguage 作為目前顯示的語言

// 表格的名稱
const formno = "cldhddr";

// 取得當前語言的字典
const fileName = import.meta.url.split("/").pop().split("%")[0];
const { labels, headers } = useI18nHeadersLabels(selectedLanguage, fileName);

// 查詢條件
const form = reactive({
  danno: "", // 單號
  supplyno: "", // 供方編碼
  spno: "", // 料號
  spspec: "", // 規格
  dhdno: "", // 訂單號
  maker: "", // 製單
  makerdtimeStart: "", // 導入日期區間起始
  makerdtimeEnd: "", // 導入日期區間結束
  gdateStart: "", // 交貨日期區間起始
  gdateEnd: "", // 交貨日期區間結束
  dhdnoStatus: "", // 狀態
});

const spkindnoOptions = ref([]); // 收貨類別選項
const spkindnoOptionsWithEmpty = computed(() => {
  return [{ spkindno: "", spkindname: "" }, ...spkindnoOptions.value];
}); // 在收貨類別選項中加入「不設限」選項

const {
  dialog,
  supplyQuery,
  tempSupplykind,
  filteredSuppliers,
  openDialog,
  handleInputSupplyQueryAndTempSupplykind,
} = useSupplyDialog(); // 供方查詢介面的狀態和方法

const selectSupplier = (supplier) => {
  // 選取供方
  form.supplyno = supplier["header.supply.supplyno"];
  dialog.value = false; // 關閉...視窗
};

// 材料的小視窗的狀態和方法, 應該可以放到composables?
const isSpDialogVisible = ref(false); // 材料的小視窗的顯示狀態
const spQuery = reactive({
  spno: "",
  spspec: "",
  matno: "",
  spunit: "",
  spkindname: "",
}); // 材料查詢條件
const sp = ref([]); // 材料查詢結果
const spFiltered = ref([]); // 過濾過的材料查詢結果
const openSpDialog = async (item = null) => {
  // 打開材料查詢介面

  // 每次材料查詢介面打開時，需清空查詢欄位，否則會殘留前次輸入的內容
  spQuery.spno = "";
  spQuery.spspec = "";
  spQuery.matno = "";
  spQuery.spunit = "";
  spQuery.spkindname = "原材料"; // 預設查詢原材料類別
  
  // 調用訂單查詢
  const params = {
    spkindno: -1, // -1 代表查詢所有材料
    supplyno: "",
  };
  sp.value = await utils.fetchData("sp.php", params);
  console.log("材料查詢結果：", sp.value);
  
  spFiltered.value = sp.value; // 初始化材料列表
  handleInputSpQuery(); // 處理材料查詢，過濾材料列表
  isSpDialogVisible.value = true; // 打開材料查詢介面
}
const handleInputSpQuery = () => {
  console.log("spQuery:", spQuery);
  // 處理材料查詢, 根據查詢條件過濾材料列表
  if (
    spQuery.spno.trim() === "" &&
    spQuery.spspec.trim() === "" &&
    spQuery.matno.trim() === "" &&
    spQuery.spunit.trim() === "" && 
    spQuery.spkindname.trim() === ""
  ) {
    spFiltered.value = sp.value;
  } else {
    spFiltered.value = sp.value.filter(
      (item) =>
        (spQuery.spno.trim() === "" ||
          (item["header.sp.spno"] &&
            item["header.sp.spno"]
              .toUpperCase()
              .includes(spQuery.spno.toUpperCase()))) &&
        (spQuery.spspec.trim() === "" ||
          (item["header.sp.spspec"] &&
            item["header.sp.spspec"]
              .toUpperCase()
              .includes(spQuery.spspec.toUpperCase()))) &&
        (spQuery.matno.trim() === "" ||
          (item["header.sp.matno"] &&
            item["header.sp.matno"]
              .toUpperCase()
              .includes(spQuery.matno.toUpperCase()))) &&
        (spQuery.spunit.trim() === "" ||
          (item["header.sp.spunit"] &&
            item["header.sp.spunit"]
              .toUpperCase()
              .includes(spQuery.spunit.toUpperCase()))) && 
        (spQuery.spkindname.trim() === "" ||
          (item["NA.spkind.spkindname"] &&
            item["NA.spkind.spkindname"]
              .toUpperCase()
              .includes(spQuery.spkindname.toUpperCase())))
    );
  }
  //console.log("spFiltered:", spFiltered.value);
};
const selectSp = async (item) => {
  // 選取材料
  form.spno = item["header.sp.spno"];
};

// 上方的欄位
const formRows = computed(() => {
  const formRowsTemp = [
    [
      labels.value["filter.cldhddr.danno"],
      // 供方編碼(componentType: icon-text-field)
      {
        ...labels.value["filter.cldhddr.supplyno"],
        icon: "mdi-dots-horizontal-circle",
        onClick: openDialog,
      },
      labels.value["filter.cldhddr.spno"],
      labels.value["filter.sp.spspec"],
      labels.value["filter.cldhddr.dhdno"],
      labels.value["filter.cldhddr.maker"],
    ],
    [
      labels.value["filter.cldhddr.makerdtimeStart"],
      labels.value["filter.cldhddr.makerdtimeEnd"],
    
      labels.value["filter.cldhddr.gdateStart"],
      labels.value["filter.cldhddr.gdateEnd"],
    ],
  ];
  return formRowsTemp;
});
console.log("formRows:", formRows.value);

// 檢查按鈕是否禁用
const {
  isAddDisabled,
  isEditDisabled,
  isDeleteOrderDisabled,
  isToggleAuditDisabled,
  isExportExcelDisabled,
  isPrintOrderDisabled,
  checkButtonFlags,
} = useCheckButtonFlags(formno, form.audit);

const results = ref([]); // 查詢結果

const query = async () => {
  // 查詢cldhddr
  const params = {
    danno: form.danno,
    supplyno: form.supplyno,
    spno: form.spno,
    spspec: form.spspec,
    dhdno: form.dhdno,
    maker: form.maker,
    makerdtimeStart: form.makerdtimeStart,
    makerdtimeEnd: form.makerdtimeEnd,
    gdateStart: form.gdateStart,
    gdateEnd: form.gdateEnd,
  };

  results.value = await utils.fetchData("cldhddr.php", params);
  console.log("查詢結果：", results.value);

  utils.formatDateTimeFields(results.value, labels.value); // 轉換日期和時間欄位
};

const { selectedRow, selectRow, isRowSelected } = useSelectRow(
  "header.cldhddr.danno"
); // 選取row相關的變數和函式

const deleteOrder = async () => {
  // 廢單

  if (selectedRow.value === null) {
    alert("請選擇一筆資料");
    return;
  }

  if (confirm("你真的要刪除嗎?")) {
    const params = {
      danno: selectedRow.value["header.cldhddr.danno"],
    };
    const data = await utils.fetchData("cldhddrDelete.php", params); // 透過api刪除資料
    console.log("刪除資料結果：", data);
  }
  alert("刪除完成");
  await query(); // 重新載入表格
  selectedRow.value = null; // 清除選擇
};

const displayResults = computed(() => {
  // 根據狀態篩選結果
  if (form.dhdnoStatus === "") {
    return results.value; // 不篩選
  } else if (form.dhdnoStatus === "completed") {
    return results.value.filter((item) => item["header.cldhddr.dhdno"] !== "");
  } else if (form.dhdnoStatus === "pending") {
    return results.value.filter((item) => item["header.cldhddr.dhdno"] === "");
  }
});

const importExcel = async (event) => {
  // 導入 Excel
  const excelData = await utils.readExcel(event);
  console.log("導入的 Excel 資料：", excelData); // excel 的內容

  // 對每一筆資料執行php
  for (const row of excelData) {
    const params = {
      supplyno: row["供方編碼"],
      spno: row["材料編碼"],
      pcs: row["采購量"],
      gdate: row["交貨日期"],
      note: row["備注"],
    };
    const data = await utils.fetchData("cldhddrAdd.php", params); // 透過api導入資料
    console.log("導入結果：", data);
    if (data.error) {
      alert(`${data.error}`); // 料號不存在時會回傳錯誤訊息
    }
  }
  alert("操作成功!");
  query(); // 重新查詢資料
};

const makeCldhd = async () => {
  // 生成采購單
  if (confirm("你真的要生成采購嗎?")) {
    const data = await utils.fetchData("cldhddrMakeCldhd.php", {}); // 透過api生成采購單
    console.log("生成采購單結果：", data);
    alert("操作成功!");
    query(); // 重新載入表格
  }
};

const isImportExcelDisabled = ref(true); // 導入 Excel 按鈕是否禁用
const isMakeCldhdDisabled = ref(true); // 生成采購單按鈕是否禁用

onMounted(async () => {
  // 檢查權限
  checkButtonFlags();
  isImportExcelDisabled.value = !(await utils.checkFlag("addflag", formno));
  isMakeCldhdDisabled.value = !(await utils.checkFlag("warnflag", formno));

  spkindnoOptions.value = await utils.fetchCategories(); // 取得收貨類別選項
});
</script>

<style scoped>

* {
  font-size: 12px; /* 調整所有元素的字體大小 */
}

.v-card {
  padding: 4px;
}

.v-row {
  padding: 0px;
  margin: 0px;
}

.v-col {
  padding: 4px;
}

:deep(.v-input__details) {
  min-height: 0  !important;
  height: auto !important;
  padding: 0 !important;
  margin: 0 !important;
}

:deep(.v-messages){
  min-height: 0  !important;
  height: auto !important;
}

.table-scroll-card {
  overflow-x: auto; /* 允許水平滾動 */
}

.v-data-table {
  border-collapse: collapse;
}
:deep(.v-table th) {
  padding: 2px !important;
  user-select: text !important; /* 允許文字被選取 */
  -webkit-user-select: text !important; /*確保在 WebKit（如 Chrome、Safari）瀏覽器上也能生效*/
}
:deep(.v-table td) {
  padding: 0px !important;
  border: 1px solid #000000 !important;
  white-space: nowrap !important;   /* 不換行，讓欄寬跟內容走 */
  width: auto; 
}


:deep(.v-table td .v-field--appended) {
  padding: 0px;
}

:deep(table input) {
  padding: 0px;
  width: auto;
}

:deep(.v-table td .v-field--variant-filled .v-field__outline::before, .v-field--variant-underlined .v-field__outline::before ) {
  border-width: 0 0 3px; /* v-text-field的邊框寬度 */
}

/* 嘗試縮小日期輸入框中文字與日曆圖示之間的空白 */
/* 針對 WebKit 瀏覽器 (Chrome, Safari, 新版 Edge) */
:deep(.v-table td .v-field__input[type="date"]::-webkit-calendar-picker-indicator) {
  margin-left: -15px !important; /* 使用負 margin 將圖示向左拉*/
}

/* 讓 v-text-field 在表格內自動寬度 */
:deep(.v-table td .v-text-field) {
  width: auto;
  vertical-align: middle !important; /* 讓內容垂直置中 */
}
:deep(input) {
  font-size: 12px;
}
:deep(.v-table td .v-field__input){
  padding: 0px !important;
  width: auto;
}
:deep(.v-select__selection-text) {
  font-size: 12px;
}

/* 數字靠右 */
.number-td {
  text-align: right !important;
}
.number-field :deep(.v-field__input) {
  text-align: right !important;
}

.container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.plus-button {
  font-size: 2rem;
  padding: 30px 10px;
  border: none;
  background-color: #007bff;
  color: white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
}


/* 調試用 - 添加邊框來查看元素範圍 */
.table-container {
  border: 2px solid red !important;
}

.custom-data-table {
  border: 2px solid blue !important;
}

:deep(.v-data-table__wrapper) {
  border: 2px solid green !important;
}




/* 此頁面特別設置, 覆寫 Vuetify 針對 outlined, single-line, no-label 變體的 v-field 底部內距 */
:deep(.v-input--density-default .v-field--variant-outlined),
:deep(.v-input--density-default .v-field--single-line),
:deep(.v-input--density-default .v-field--no-label) {
  --v-field-padding-bottom: 0px !important;
}

:deep(.v-input--density-default) {
  --v-input-padding-top: 0px !important;
}

:deep(.v-field--variant-filled ){
  --v-input-control-height: 30px !important;
}
</style>
