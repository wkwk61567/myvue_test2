<!-- 采購退貨單明細頁面 -->
<template>
  <v-container style="max-width: none">
    <ButtonsCRUDP
      :add="() => setMode('add')"
      :isAddDisabled="isAddDisabled"
      :edit="() => setMode('edit')"
      :isEditDisabled="isEditDisabled"
      :deleteOrder="deleteOrder"
      :isDeleteOrderDisabled="isDeleteOrderDisabled"
      :toggleAudit="toggleAudit"
      :isToggleAuditDisabled="isToggleAuditDisabled"
      :exportExcel="
        () =>
          utils.exportExcel(
            results,
            headers,
            '采購退貨單明細',
            '采購退貨單明細'
          )
      "
      :isExportExcelDisabled="isExportExcelDisabled"
      :isButtonsCRUDPVisible="mode === 'view'"
    />
    <ButtonsSaveDiscard
      :save="save"
      :isSaveDisabled="
        !isFormComplete || !isAllFieldValid || results.length === 0
      "
      :saveTooltipString="
        !isFormComplete
          ? '請先填入供方編碼和倉庫類別'
          : !isAllFieldValid
          ? '請先完成表格中未填寫的必填欄位'
          : results.length === 0
          ? '請先加入資料'
          : ''
      "
      :discard="discard"
      :isButtonsSaveDiscardVisible="mode !== 'view'"
    />
    <!-- form區塊 -->
    <v-card>
      <v-card-text>
        <v-row v-for="(row, rowIndex) in formRows" :key="rowIndex">
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
                  :label="field.name"
                  :readonly="
                    field.isReadonly ? field.isReadonly ():
                    utils.isReadonly(
                      mode,
                      field.inputType,
                      field.isEditable,
                      field.componentType
                    )
                  "
                  :style="{ backgroundColor: INPUT_COLORS[field.inputType] }"
                  :append-inner-icon="field.icon"
                  @click:append-inner="field.onClick"
                  :error="isErrorVisible(mode, field, form[field.column])"
                />
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
                  :label="field.name"
                  :readonly="
                    field.isReadonly ? field.isReadonly ():
                    utils.isReadonly(
                      mode,
                      field.inputType,
                      field.isEditable,
                      field.componentType
                    )
                  "
                  :style="{ backgroundColor: INPUT_COLORS[field.inputType] }"
                  v-bind="
                    field.componentType === 'checkbox'
                      ? {
                          disabled: utils.isReadonly(
                            mode,
                            field.inputType,
                            field.isEditable,
                            field.componentType
                          ),
                        }
                      : field.componentType === 'select'
                      ? {
                          'item-title': field.column,
                          'item-value': field.column,
                          items: formSelectOptions[field.column].value,
                        }
                      : field.componentType === 'date'
                      ? { type: 'date' }
                      : {}
                  "
                  :error="isErrorVisible(mode, field, form[field.column])"
                  @change="updateForm(field)"
                  @update:modelValue="
                    field.componentType === 'select' ? updateForm(field) : null
                  "
                />
              </template>
            </v-col>
          </template>
        </v-row>
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

        <!-- 調用訂單的小視窗 -->
        <CallOrderDialog
          :isCallOrderDialogVisible="isCallOrderDialogVisible"
          @update:isCallOrderDialogVisible="isCallOrderDialogVisible = $event"
          :supplyno="form.supplyno"
          :orderQuery="orderQuery"
          @update:orderQuery[danno]="orderQuery.danno = $event"
          @update:orderQuery[spno]="orderQuery.spno = $event"
          @update:orderQuery[spspec]="orderQuery.spspec = $event"
          @update:orderQuery[status]="orderQuery.status = $event"
          :orderFiltered="orderFiltered"
          @handleInputOrderQuery="handleInputOrderQuery"
          @selectOrder="
            (item) => selectOrder(item)
          "
        ></CallOrderDialog>

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
    <!-- disable-pagination 停用分頁功能 
      hide-default-footer 隱藏預設的頁尾 
      items-per-page="-1" 顯示所有資料
      fixed-header 固定表頭
       -->
    <v-card class="mt-4 table-scroll-card">
      <v-data-table
        :headers="displayHeaders"
        :items="results"
        disable-pagination
        hide-default-footer
        :items-per-page="-1"
        no-data-text="No data available"
        style="min-width: 1200px; max-height: 400px; overflow-y: auto"
        fixed-header
        height="400px"
      >
        <!-- 自定義 header 插槽，強制渲染表頭 -->
        <template v-slot:header>
          <thead>
            <tr>
              <th v-for="header in displayHeaders" :key="header.key">
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
              :style="isHovering ? { backgroundColor: HOVER_COLOR } : {}"
            >
              <!-- 編輯按鈕(筆或勾勾)和刪除按鈕 -->
              <template v-if="mode !== 'view'">
                <td :style="{ 'font-size': '24px' }">
                  <v-btn icon @click="deleteRow(item)">
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </td>
              </template>
              <!-- 使用迴圈動態生成表格的欄位 -->
              <!-- 用specialTableColumns做特殊處理 -->
              <!-- 暫收重量的背景顏色會隨是否允許輸入而變化 -->
              <template v-for="header in headers" :key="header.key">
                <td
                  v-if="specialTableColumns[header.key]"
                  :style="{
                    backgroundColor:
                      header.key !== 'header.cljhditm.kg'
                        ? INPUT_COLORS[labels[header.key].inputType]
                        : !(
                            item.spkindno === '3' &&
                            (item.clkind === '板料' || item.clkind === '鋁擠型')
                          )
                        ? INPUT_COLORS['fixed']
                        : INPUT_COLORS['inputable'],
                  }"
                >
                  <component
                    :is="
                      labels[header.key].componentType === 'checkbox'
                        ? 'v-checkbox'
                        : labels[header.key].componentType === 'select'
                        ? 'v-select'
                        : 'v-text-field'
                    "
                    v-model="item[header.key]"
                    v-bind="
                      specialTableColumns[header.key].getProps(item, header.key)
                    "
                    v-on="
                      specialTableColumns[header.key].getEvents(
                        item,
                        header.key
                      )
                    "
                  />
                </td>
                <td
                  v-else
                  :style="{
                    backgroundColor: INPUT_COLORS[labels[header.key].inputType],
                  }"
                  :class="
                    labels[header.key]?.dataType === 'number' ? 'number-td' : ''
                  "
                >
                  {{ item[header.key] }}
                </td>
              </template>
            </tr>
          </v-hover>
        </template>
        <!-- 底部的加總欄位 -->
        <template v-slot:tfoot>
          <tr>
            <!-- 使用迴圈動態生成需要加總的欄位 -->
            <template v-for="header in displayHeaders" :key="header.key">
              <td
                v-if="columnsForSum.includes(header.key)"
                :style="{ backgroundColor: INPUT_COLORS['fixed'] }"
                :class="
                  labels[header.key]?.dataType === 'number' ? 'number-td' : ''
                "
              >
                {{ utils.calculateColumnSum(results, header.key) }}
              </td>
              <td v-else :style="{ backgroundColor: INPUT_COLORS['fixed'] }">
                <!-- 不需要加總的欄位保持空白 -->
              </td>
            </template>
          </tr>
        </template>
      </v-data-table>

      <!-- 下方的加號(功能與調用訂單按鈕相同) -->
      <template v-if="mode !== 'view'">
        <div class="container">
          <v-tooltip
            v-if="!isFormComplete || !isAllFieldValid"
            location="top"
            activator="parent"
            open-on-hover
          >
            <template v-if="!isFormComplete">
              請先填入供方編碼和倉庫類別
            </template>
            <template v-else-if="!isAllFieldValid">
              請先完成表格中未填寫的必填欄位
            </template>
          </v-tooltip>
          <v-btn
            class="plus-button"
            color="primary"
            @click="() => openCallOrdersDialog(form.supplyno)"
            :disabled="!isFormComplete || !isAllFieldValid"
            >+</v-btn
          >
        </div>
      </template>
    </v-card>
  </v-container>
</template>

<script setup>
import {
  ref,
  reactive,
  computed,
  onMounted,
  onBeforeUnmount,
  inject,
  nextTick
} from "vue";
import { useRouter } from "vue-router";
import { SERIAL_PREFIX, INPUT_COLORS, HOVER_COLOR } from "@/config.js";
import * as utils from "@/utils/utils.js";
import ButtonsCRUDP from "@/components/ButtonsCRUDP.vue";
import ButtonsSaveDiscard from "@/components/ButtonsSaveDiscard.vue";
import SupplyDialog from "@/components/SupplyDialog.vue";
import CallOrderDialog from "@/components/CallOrderDialog.vue";
import SpDialog from "@/components/SpDialog.vue";
import { useCheckButtonFlags } from "@/composables/useCheckButtonFlags.js";
import { useI18nHeadersLabels } from "@/composables/useI18nHeadersLabels.js";
import { useOrderDialog } from "@/composables/useOrderDialog.js";
import { useFieldValidate } from "@/composables/useFieldValidate.js";
import { useSupplyDialog } from "@/composables/useSupplyDialog.js";
import { useTableColumnConfig } from "@/composables/useTableColumnConfig.js";

const props = defineProps({
  danno: String,
}); // 從url接收
const selectedLanguage = inject("selectedLanguage");
const router = useRouter();

// 表格的名稱
const formno = "clthd"; // 與cljhd共用表格
const tableNameMST = "cljhdmst";
const tableNameITM = "cljhditm";

// 取得當前語言的字典
const fileName = import.meta.url.split("/").pop().split("%")[0];
const { labels, headers } = useI18nHeadersLabels(selectedLanguage, fileName);

// 上方的欄位
const form = reactive({
  danno: props.danno, // 收貨單號 從url接收
  supplyno: "", // 供方編碼
  ddate: "", // 收貨日期
  ckkind: "", // 倉庫類別
  supplyname: "", // 供方名稱
  dannobase: "", // 原始單號
  yjdno: "", // 請款單號 (暫不使用)
  demo: "", // 備註
  maker: "", // 制單
  audit: "", // 審核
});

const spkindnoOptions = ref([]); // 收貨類別選項
const spkindnoOptionsWithEmpty = computed(() => {
  return [{ spkindno: "", spkindname: "" }, ...spkindnoOptions.value];
}); // 在收貨類別選項中加入「不設限」選項

const ckkindOptions = ref([]); // 倉庫類別選項
//["保稅良品", "保稅不良品", "內銷良品", "內銷不良品", "生產倉", "生產不良倉", "加工倉", "加工不良倉", "成品倉", "品保倉"]
const formSelectOptions = {
  ckkind: ckkindOptions,
}; // form中的所有選單的選項
const fetchCkkindOptions = async () => {
  // 獲取倉庫類別選項

  const data = await utils.fetchData("supply.php", {});
  // 根據form.supplyno的值過濾出對應的supplykind
  const supplykind = data.find(
    (item) => item.supplyno === form.supplyno
  )?.supplykind;
  if (supplykind === "原材料" || supplykind === "輔料" || supplykind === "紙箱") {
    return ["保稅良品", "保稅不良品", "內銷良品", "內銷不良品"];
  } else if (supplykind === "半成品") {
    return ["生產倉", "生產不良倉", "加工倉", "加工不良倉"];
  } else if (supplykind === "成品" || supplykind === "樣品") {
    return ["成品倉", "品保倉"];
  } else {
    console.error("不支援的供方類別:", supplykind);
    return []; // 返回空數組以防錯誤
  }

}

const results = ref([]); // 查詢結果(表格的內容)
const idLastInDB = ref("0"); // 最後一筆已儲存的row的 id，用來分隔原有的row和新增的row //
const idCurrent = ref(0); // 目前最新的一筆row的 id
const selectRow = ref(null); // 用來儲存選取的行, 直接點選表格中的...按鈕時使用

const reset = () => {
  // 重設所有欄位(原本會在initializeData中加載的變數)

  Object.keys(form).forEach((key) => {
    form[key] = "";
  }); // 將所有 form 屬性設為空字串
  results.value = [];
  idLastInDB.value = "0"; // 重置最後一筆已儲存的row的 id
  idCurrent.value = 0; // 重置目前最新的一筆row的 id
  ckkindOptions.value = []; // 清空倉庫類別選項
};

const {
  isCallOrderDialogVisible, // 調用訂單介面(CallOrderDialog)是否顯示
  orderQuery, // 用來存儲調用訂單介面(CallOrderDialog)的訂單查詢條件
  orderFiltered, // 用來存儲過濾後的訂單列表 顯示於調用訂單介面(CallOrderDialog)
  openCallOrdersDialog, // 打開調用訂單介面(CallOrderDialog)
  handleInputOrderQuery, // 處理調用訂單介面(CallOrderDialog)的查詢條件
} = useOrderDialog(selectRow); // 訂貨單的小視窗的狀態和方法

const kcpcsMap = {
  "保稅良品": "pcs",
  "保稅不良品": "pcsth",
  "內銷良品": "pcsnx",
  "內銷不良品": "pcsthnx",
  "生產倉": "pcsbp",
  "生產不良倉": "pcsbpth",
  "加工倉": "pcsjg",
  "加工不良倉": "pcsjgth",
  "成品倉": "pcs", // 和保稅良品倉共用一個欄位. 此外還有一個wypcs和這個欄位的值相同, 不知道是什麼
  "品保倉": "pcsqc",
}; // 倉庫對應的庫存欄位 #BusinessLogic

const selectOrder = async (item) => {
  // 暫時儲存訂單到下方的表格

  // 檢查交貨日期 #BusinessLogic
  if (! form.ddate) {
    alert("收貨日期未設定");
    return;
  }
  const gdate = new Date(item["header.cldhditm.gdate"]);
  const earliestAllowedDate = new Date(gdate);
  earliestAllowedDate.setDate(gdate.getDate() - 3);
  if (new Date( form.ddate) < earliestAllowedDate) {
    alert("交期未到, 只能提前3天交貨"); // #BusinessLogic
    return;
  }

  idCurrent.value += 1;

  // 根據在調用訂單對話框選擇的訂單，將相關資訊帶入下方表格
  let tempItem = {};
  tempItem["header.cljhditm.id"] = idCurrent.value;
  tempItem["header.cljhditm.dhdno"] = item["header.cldhditm.danno"];
  tempItem["header.cljhditm.dhdid"] = item["header.cldhditm.dhdid"];
  tempItem["header.cljhditm.spno"] = item["header.cldhditm.spno"];
  tempItem["header.sp.spspec"] = item["header.sp.spspec"];
  tempItem["header.sp.spunit"] = item["header.sp.spunit"];
  tempItem["header.cljhditm.kcpcs"] = item["NA.sp." + kcpcsMap[form.ckkind]]; // 根據倉庫類別，取得對應的庫存數量
  tempItem["header.cljhditm.pcs"] = 0;
  tempItem["header.cljhditm.kg"] = 0;
  tempItem["header.cljhditm.payno"] = item["header.cldhditm.payno"];
  tempItem["header.cljhditm.price"] = item["header.cldhditm.price"];
  tempItem["header.cljhditm.pay"] = 0;
  tempItem["NA.sp.dz"] = item["NA.sp.dz"];
  tempItem.spkindno = item.spkindno;
  tempItem.clkind = item.clkind;

  if (selectRow.value === null || mode.value === "edit") {
    // 會造成出現沒有填寫完表格就可以直接點擊...按鈕新增一行的情況, 這樣應該不太好?
    results.value.push(tempItem); // 新增一行
    isCallOrderDialogVisible.value = false; // 關閉調用訂單介面
    
    await nextTick(); 
    focusNextInvalidField(tempItem); // 等待DOM更新後，將焦點設置到新添加的行
    selectRow.value = null; // 清除選取的行
  } else {
    // 如果是直接點選表格中的材料編碼，則更新該行
    // 改變材料編碼會影響多個欄位, 且使用者必須重新填寫實收數, 但是編輯模式時一次只保存一個欄位, 如果允許在編輯模式修改材料編碼, 會與現在的邏輯不符合
    tempItem["header.cljhditm.id"] = selectRow.value["header.cljhditm.id"]; // 保留原有的id
    idCurrent.value--; // 恢復idCurrent的值
    console.log("更新選取的行：", selectRow.value);
    Object.assign(selectRow.value, tempItem); // 更新選取的行
    isCallOrderDialogVisible.value = false; // 關閉調用訂單介面

    await nextTick(); 
    focusNextInvalidField(selectRow.value); // 等待DOM更新後，將焦點設置到更新的行
    selectRow.value = null; // 清除選取的行
  }
}

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
  selectRow.value = item; // 直接點選表格中的材料編碼時，儲存選取的行

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
  console.log("選取的材料：", item);

  idCurrent.value += 1;

  let tempItem = {};
  tempItem["header.cljhditm.id"] = idCurrent.value;
  tempItem["header.cljhditm.dhdno"] = "";
  tempItem["header.cljhditm.dhdid"] = "";
  tempItem["header.cljhditm.spno"] = item["header.sp.spno"];
  tempItem["header.sp.spspec"] = item["header.sp.spspec"];
  tempItem["header.sp.spunit"] = item["header.sp.spunit"];
  tempItem["header.cljhditm.kcpcs"] = item["NA.sp." + kcpcsMap[form.ckkind]]; // 根據倉庫類別，取得對應的庫存數量
  tempItem["header.cljhditm.pcs"] = 0;
  tempItem["header.cljhditm.kg"] = 0;
  tempItem["header.cljhditm.payno"] = item["NA.sp.payno"];
  tempItem["header.cljhditm.price"] = 0;
  tempItem["header.cljhditm.pay"] = 0;
  tempItem["NA.sp.dz"] = item["NA.sp.dz"];
  tempItem.spkindno = item["NA.sp.spkindno"];
  tempItem.clkind = item["NA.sp.clkind"];
  console.log("選擇的工令單資料：", tempItem);

  if (selectRow.value === null || mode.value === "edit") {
    results.value.push(tempItem); // 新增一行
    isSpDialogVisible.value = false; // 關閉材料查詢視窗

    await nextTick(); 
    focusNextInvalidField(tempItem); // 等待DOM更新後，將焦點設置到新添加的行
  } else {
    // 如果是直接點選表格中的材料編碼，則更新該行
    // 改變材料編碼會影響多個欄位, 且使用者必須重新填寫實收數, 但是編輯模式時一次只保存一個欄位, 如果允許在編輯模式修改材料編碼, 會與現在的邏輯不符合
    tempItem["header.cljhditm.id"] = selectRow.value["header.cljhditm.id"]; // 保留原有的id
    tempItem["header.cljhditm.dhdno"] = selectRow.value["header.cljhditm.dhdno"]; // 保留原有的dhdno
    tempItem["header.cljhditm.dhdid"] = selectRow.value["header.cljhditm.dhdid"]; // 保留原有的dhdid
    idCurrent.value--; // 恢復idCurrent的值
    console.log("更新選取的行：", selectRow.value);
    Object.assign(selectRow.value, tempItem); // 更新選取的行
    isSpDialogVisible.value = false; // 關閉材料查詢視窗

    await nextTick(); 
    focusNextInvalidField(selectRow.value); // 等待DOM更新後，將焦點設置到更新的行
    selectRow.value = null; // 清除選取的行
  }
};

const orderInDBNum = ref(0); // 原本的行數，用來判斷是不是只剩一個row，是的話會在刪除此row後刪除整張收貨單

const convertItemValues = (item, toNegative = true) => {
  // 將指定欄位的數值轉換為正數或負數
  const keys = [
    "header.cljhditm.pcs",
    "header.cljhditm.kg",
    "header.cljhditm.pay"
  ];
  keys.forEach(key => {
    if (typeof item[key] === "number") {
      item[key] = toNegative
        ? -Math.abs(item[key])
        : Math.abs(item[key]);
    }
  });
};

const mode = ref("view"); // 當前模式，默認為查看模式
const setMode = async (newMode) => {
  // 設定模式
  if (newMode === "add") {
    // 設定為新增模式
    reset(); // 重設所有欄位

    [form.ddate] = utils.getCurrentDateTime(); // 取得當前日期

    //  取得流水號(danno)
    const params = {
      prefix: `${SERIAL_PREFIX}YB`,
      table: tableNameMST,
    };
    const dannoData = await utils.fetchData("getSerialNumber.php", params);
    form.danno = dannoData[0].NewDanno;

    // 取得製單
    const userData = await utils.fetchData("checkAuthenticated.php");
    console.log("用戶資料：", userData);
    form.maker = userData.powername;
  } else if (newMode === "edit") {
    // 設定為修改模式
    if (form.audit !== null && form.audit !== "") {
      alert("此單已審核，不能修改"); // #BusinessLogic
      return;
    }
  } else if (newMode === "view") {
    // 設定為查看模式
    form.danno = props.danno;
    await initializeData(); // 重新加載資料
  } else {
    console.error("未知的模式：", newMode);
    return;
  }
  mode.value = newMode;
};

// 需要加總的欄位名稱
const columnsForSum = ref([
  "header.cljhditm.pcs",
  "header.cljhditm.kg",
  "header.cljhditm.pay",
]);

const displayHeaders = computed(() => {
  const currentHeaders = [...headers.value];
  if (mode.value !== "view") {
    currentHeaders.unshift({ title: "", key: "deleteButton" });
  }
  return currentHeaders;
}); // 加入刪除按鈕

const initializeData = async () => {
  // 加載資料
  const params = {
    danno: form.danno,
  };

  const data = await utils.fetchData("clthdDetails.php", params); //透過api獲取資料
  console.log("查詢結果：", data);
  if (
    !data["form"] ||
    data["form"].length === 0 ||
    !data["table"] ||
    data["table"].length === 0
  ) {
    // 如果沒有資料, 設定顯示空白訂單

    // 新增按鈕之外的其他按鈕都禁用
    isAddDisabled.value = false;
    isEditDisabled.value = true;
    isDeleteOrderDisabled.value = true;
    isToggleAuditDisabled.value = true;
    isExportExcelDisabled.value = true;
    isPrintOrderDisabled.value = true;

    reset(); // 重設所有欄位
    return; // 如果沒有資料，則不進行後續操作
  }

  // 接收查詢結果
  results.value = data["table"];
  
  results.value.forEach((item) => {
    convertItemValues(item, false); // 轉換成正數 #BusinessLogic
  });

  idLastInDB.value = data["table"].at(-1)["header.cljhditm.id"]; // 取得DB最後一筆的 id
  console.log("最後一筆的 id：", idLastInDB.value);
  idCurrent.value = idLastInDB.value; // 設置目前的 id 為DB最後一筆的 id
  Object.keys(form).forEach((key) => {
    form[key] = data["form"][0][key];
  }); // 將所有 form 欄位的值設為查詢結果的對應值
  form.ddate = form.ddate.date.split(" ")[0]; // 將日期切割成 YYYY-MM-DD

  ckkindOptions.value = await fetchCkkindOptions(); // 取得倉庫類別選項
  
  orderInDBNum.value = results.value.length; // 取得原本的行數
  console.log("results:", results.value);
  await checkButtonFlags(); // 檢查按鈕狀態
};

const {
  dialog,
  supplyQuery,
  tempSupplykind,
  filteredSuppliers,
  openDialog,
  handleInputSupplyQueryAndTempSupplykind,
} = useSupplyDialog(); // 供方查詢介面的狀態和方法

const selectSupplier = async (supplier) => {
  // 用戶選擇供方編碼後，將編碼放入供方編碼欄位
  form.supplyno = supplier["header.supply.supplyno"];
  form.supplyname = supplier["header.supply.supplyname"];
  form.spkindname = supplier["header.supply.supplykind"]; // 設定收貨類別為供方類別

  ckkindOptions.value = await fetchCkkindOptions(); // 取得倉庫類別選項

  form.ckkind = ""; // 倉庫類別預設為空
  dialog.value = false; // 關閉小視窗
};

const save = async () => {
  // 存檔到資料庫

  results.value.forEach((item) => {
    convertItemValues(item, true); // 轉換成負數 #BusinessLogic
  });

  if (mode.value === "add") {
    // 保存form和table的資料到資料庫
    const itm = results.value.map((item) => ({
      id: item["header.cljhditm.id"],
      spno: item["header.cljhditm.spno"],
      pcs: item["header.cljhditm.pcs"],
      kg: item["header.cljhditm.kg"],
      payno: item["header.cljhditm.payno"],
      price: item["header.cljhditm.price"],
      dhdno: item["header.cljhditm.dhdno"],
      kcpcs: item["header.cljhditm.kcpcs"],
      dhdid: item["header.cljhditm.dhdid"],
    }));
    const params = {
      danno: form.danno, 
      dannobase: form.dannobase, 
      ddate: form.ddate, 
      supplyno: form.supplyno, 
      demo: form.demo, 
      ckkind: form.ckkind, 
      itm: itm,
    };

    results.value.forEach((item) => {
      convertItemValues(item, false); // 轉換成正數 #BusinessLogic
    });

    const data = await utils.fetchData("clthdDetailsAdd.php", params); // 透過api新增資料
    console.log("新增資料結果：", data);
    alert("存檔完成");
    const url = {
      path: `/clthdDetails/${form.danno}`,
    };
    await router.push(url); // 移動到新增的訂單的頁面
  } else if (mode.value === "edit") {
    // 保存新增的row到資料庫
    const itemsToBeAdded = results.value.filter(
      (item) => item["header.cljhditm.id"] > idLastInDB.value
    ); // 表格中新增的資料
    const itm = itemsToBeAdded.map((item) => ({
      id: item["header.cljhditm.id"],
      spno: item["header.cljhditm.spno"],
      pcs: item["header.cljhditm.pcs"],
      kg: item["header.cljhditm.kg"],
      payno: item["header.cljhditm.payno"],
      price: item["header.cljhditm.price"],
      dhdno: item["header.cljhditm.dhdno"],
      kcpcs: item["header.cljhditm.kcpcs"],
      dhdid: item["header.cljhditm.dhdid"],
    }));
    const params = {
      danno: form.danno,
      itm: itm,
    };

    results.value.forEach((item) => {
      convertItemValues(item, false); // 轉換成正數 #BusinessLogic
    });

    const data = await utils.fetchData("clthditmUpdateNewRow.php", params); // 透過api更新資料
    console.log("更新資料結果：", data);
    alert("存檔完成");
  }

  await setMode("view"); // 切換到查看模式
};

const discard = async () => {
  // 放棄

  let confirmMessage = "";
  const isHasUnsavedRows = results.value.some(
    (item) => item["header.cljhditm.id"] > idLastInDB.value
  ); // 是否有未儲存的行
  const isNoRowsInDB = orderInDBNum.value === 0; // 是否沒有行在資料庫中

  if (mode.value === "add") {
    if (isHasUnsavedRows) {
      confirmMessage = "有未保存的行，您確定要放棄嗎?";
    }
  } else if (mode.value === "edit") {
    if (isHasUnsavedRows && isNoRowsInDB) {
      confirmMessage =
        "有未保存的行，放棄將會導致整張單據刪除，您確定要放棄嗎?";
    } else if (isHasUnsavedRows) {
      confirmMessage = "有未保存的行，您確定要放棄嗎?";
    } else if (isNoRowsInDB) {
      confirmMessage = "放棄將導致整張單據刪除，您確定要放棄嗎?";
    }
  }

  if (confirmMessage && !confirm(confirmMessage)) return; // 如果使用者按取消, 不進行放棄

  if (mode.value === "edit" && isNoRowsInDB) {
    const params = {
      danno: form.danno,
      target: "mst",
    };
    const data = await utils.fetchData("clthdDelete.php", params); // 透過api刪除資料
    console.log("刪除資料結果：", data);
  }

  setMode("view"); // 切換到查看模式
};

const updateForm = async (field) => {
  // 更新form的欄位

  // 檢查日期是否是今天以後的日期 #BusinessLogic
  if (field.column === "ddate") {
    if (isFieldValid(form[field.column], field.key, form) === false) {
      alert("日期錯誤, 不能開今天以後的單");
      form[field.column] = "";
      return;
    }
  }

  if (mode.value === "edit") {
    // 更新資料庫

    // 檢察欄位是否有效
    if (!isFieldValid(form[field.column], field.key, form)) {
      return;
    }

    if (confirm(`您確定要更新${field.name}為${form[field.column]}嗎?`)) {
      const params = {
        danno: form.danno,
        column: field.column,
        value: form[field.column],
      };
      const data = await utils.fetchData("clthdmstUpdate.php", params); // 透過api更新資料
      console.log("更新結果:", data);
      alert("更新完成");
    }
  }
};

const updateTable = async (item, key) => {
  // 更新table的欄位
  
  if (key === "header.cljhditm.pcs") {
    // 檢查數量是否大於庫存 #BusinessLogic
    if (item[key] > Math.ceil(parseFloat(item["header.cljhditm.kcpcs"]))) {
      alert("數量不能大於庫存");
      item[key] = 0; // 如果數量大於庫存, 則設為0
      return;
    }
  }

  // 如果!(spkindno===3 && (clkind === '板料' || clkind === '鋁擠型')), kg設為pcs*dz #BusinessLogic
  if (
    !(
      item.spkindno === "3" &&
      (item.clkind === "板料" || item.clkind === "鋁擠型")
    )
  ) {
    item["header.cljhditm.kg"] = parseFloat(
      (item["header.cljhditm.pcs"] * item["NA.sp.dz"]).toFixed(4)
    );
  }

  // 只有原材料是以kg為單位計價 #BusinessLogic
  if (item.spkindno === "3") {
    item["header.cljhditm.pay"] = parseFloat(
      (item["header.cljhditm.kg"] * item["header.cljhditm.price"]).toFixed(2)
    ); // 計算金額
  } else {
    item["header.cljhditm.pay"] = parseFloat(
      (item["header.cljhditm.pcs"] * item["header.cljhditm.price"]).toFixed(2)
    ); // 計算金額
  }
  
  if (mode.value === "edit") {
    // 更新資料庫

    // 新的欄位先跳過
    if (item["header.cljhditm.id"] > idLastInDB.value) {
      console.log("需要按存檔按鈕");
      return;
    }

    // 檢察欄位是否有效
    if (!isFieldValid(item[key], key, item)) {
      console.error(`欄位 ${key} 的值無效:`, item[key]);
      return;
    }

    if (confirm(`您確定要更新${labels.value[key].name}為${item[key]}嗎?`)) {
      
      convertItemValues(item, true); // 轉換成負數 #BusinessLogic

      const params = {
        danno: form.danno,
        id: item["header.cljhditm.id"],
        column: labels.value[key].column,
        value: item[key],
      };

      convertItemValues(item, false); // 轉換成正數 #BusinessLogic
    
      const data = await utils.fetchData("clthditmUpdate.php", params); // 透過api更新資料
      if (data.error) {
        console.error("更新失敗:", data.error);
        alert("更新失敗: " + data.error);
        return;
      }
      console.log("更新結果:", data);
      alert("更新完成");
    }

    
  }
};

const deleteRow = async (item) => {
  // 刪行
  if (item["header.cljhditm.id"] <= idLastInDB.value) {
    if (confirm("您確定要刪除?")) {
        const params = {
          danno: form.danno,
          id: item["header.cljhditm.id"],
          target: 'itm',
        };
        const data = await utils.fetchData("clthdDelete.php", params); // 透過api刪除資料
        console.log("刪除資料結果：", data);
        alert("刪除完成");
        const index = results.value.findIndex(
          (result) => result["header.cljhditm.id"] === item["header.cljhditm.id"]
        );
        if (index !== -1) {
          results.value.splice(index, 1); // 從 results 中移除
          orderInDBNum.value = orderInDBNum.value - 1; // 更新行數
        } else {
          console.error("Item not found in results:", item);
        }
      }
  } else {
    // 刪除新增的row
    const index = results.value.findIndex(
      (result) => result["header.cljhditm.id"] === item["header.cljhditm.id"]
    );
    if (index !== -1) {
      // 從 results 中移除該項
      results.value.splice(index, 1);
    } else {
      console.error("Item not found in results:", item);
    }
  }
};

const deleteOrder = async () => {
  // 廢單
  if (form.audit === null || form.audit === "") {
    if (confirm("您確定要刪除整張單據嗎?")) {
      try {
        for (let item of results.value) {
          const params = {
            danno: form.danno,
            id: item["header.cljhditm.id"],
            target: "all",
          };
          const data = await utils.fetchData("clthdDelete.php", params); // 透過api刪除資料
          console.log("刪除資料結果：", data);
        }
        alert("刪除完成");
        initializeData(); // 重新加載資料
      } catch (error) {
        console.error("刪除單據時發生錯誤:", error);
        alert("刪除失敗");
      }
    }
  } else {
    alert("此單已審核，不能刪除"); // #BusinessLogic
  }
};

const toggleAudit = async () => {
  // 審核(反審核)
  const isAudit = form.audit === null || form.audit === "";
  const params = {
    danno: form.danno,
    table: tableNameMST,
    formno: formno,
  };

  await utils.auditOrder(isAudit, params); // 切換資料庫中的審核狀態
  await initializeData(); // 重新加載資料

  await checkButtonFlags(); // 審核狀態改變後，重新檢查按鈕狀態
};

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

// 上方的欄位
const formRows = computed(() => {
  const formRowsTemp = [
    [
      labels.value["label.cljhdmst.danno"],
      {
        ...labels.value["label.cljhdmst.supplyno"],
        componentType: "icon-text-field",
        icon:
          mode.value === "add" && isAllFieldValid.value && form.supplyno === ""
            ? "mdi-dots-horizontal-circle"
            : null,
        onClick: openDialog,
      },
    ],
    [
      labels.value["label.cljhdmst.ddate"],
      {
        ...labels.value["label.cljhdmst.ckkind"],
        isReadonly: () => form.ckkind !== "" // 特殊的唯讀邏輯, 如果ckkind已經有值了, 則不允許修改 #BusinessLogic
      },
      labels.value["label.supply.supplyname"],
    ],
    [
      labels.value["label.cljhdmst.dannobase"],
      labels.value["label.cljhdmst.yjdno"],
    ],
    [
      labels.value["label.cljhdmst.demo"],
      labels.value["label.cljhdmst.maker"],
      labels.value["label.cljhdmst.audit"],
    ],
  ];
  return formRowsTemp;
});
console.log("formRows:", formRows.value);

// 驗證表格欄位是否已填寫正確
const fieldRefs = reactive({});
const setFieldRef = (refName) => (el) => {
  if (el) {
    fieldRefs[refName] = el;
  }
};
const {
  isFieldValid,
  getInvalidGroupNames,
  isRowFieldsValid,
  isAllFieldValid,
  handleFocus,
  handleBlur,
  isFieldDisabled,
  focusNextInvalidField,
  isFocusMechanismActive,
  isErrorVisible,
  isFormComplete,
} = useFieldValidate(results, form, formRows.value, fieldRefs, labels.value, "header.cljhditm.id");

const { numberColumnsConfig, textColumnsConfig, dateColumnsConfig } =
  useTableColumnConfig(
    mode,
    labels,
    isFieldValid,
    getInvalidGroupNames,
    handleFocus,
    handleBlur,
    isFieldDisabled,
    isFocusMechanismActive,
    updateTable,
    setFieldRef,
    "header.cljhditm.id"
); // 通用的表格欄位設定

// 表格中需要特殊處理的欄位
const specialTableColumns = {
  "header.cljhditm.dhdno": {
    getProps: (item, key) => ({
      readonly: true,
      "append-inner-icon": mode.value === "add" ? "mdi-dots-horizontal-circle" : null,
      class: labels.value[key]?.dataType === "number" ? "number-field" : "",
    }),
    getEvents: (item, key) => ({
      "click:append-inner": () => openCallOrdersDialog(form.supplyno, item),
    }),
  },
  "header.cljhditm.spno": {
    getProps: (item, key) => ({
      readonly: true,
      "append-inner-icon": mode.value === "add" ? "mdi-dots-horizontal-circle" : null,
      class: labels.value[key]?.dataType === "number" ? "number-field" : "",
    }),
    getEvents: (item, key) => ({
      "click:append-inner": () => openSpDialog(item),
    }),
  },
  "header.cljhditm.pcs": numberColumnsConfig(4),
  "header.cljhditm.kg": {
    getProps: (item, key) => ({
      ref: setFieldRef(`field_${item["header.cljhditm.id"]}_${key}`),
      readonly:
        mode.value === "view" ||
        !(
          item.spkindno === "3" &&
          (item.clkind === "板料" || item.clkind === "鋁擠型")
        ) ||
        isFieldDisabled(item, key),
      class: labels.value[key]?.dataType === "number" ? "number-field" : "",
      error:
        !isFieldValid(item[key], key, item) ||
        labels.value[key].validationGroup === getInvalidGroupNames(item)[0],
      "error-messages":
        isFocusMechanismActive.value && !isFieldDisabled(item, key)
          ? "必填"
          : labels.value[key].validationGroup === getInvalidGroupNames(item)[0]
          ? "擇一填寫"
          : null,
    }),
    getEvents: (item, key) => ({
      focus: (event) => handleFocus(item, key, event.target),
      blur: (event) => handleBlur(item, key, event.target),
      change: () => {
        utils.handleField(item, key, 4);
        updateTable(item, key);
      },
    }),
  },
  "header.cljhditm.price": numberColumnsConfig(4)
};

function handleBeforeUnload(event) {
  // 在離開頁面前檢查是否有未儲存的變更
  if (mode.value !== "view") {
    event.preventDefault(); // 只有在非view模式才彈窗，提示使用者有未儲存的變更
    event.returnValue = ""; // 為了相容舊版瀏覽器，需要設置 returnValue
  }
}

function handlePageHide(event) {
  // 執行清理操作，刪除沒有itm的mst
  if (mode.value === "edit" && orderInDBNum.value === 0) {
    // 使用 navigator.sendBeacon() 可靠地在頁面卸載時發送請求。
    // 它以非同步方式發送請求，不會延遲頁面的卸載，確保資料能成功發送。
    // 注意：sendBeacon 發送的是 POST 請求。
    // #BusinessLogic
    const formData = new FormData(); // 內建的類別
    formData.append("danno", form.danno);
    formData.append("target", "mst");
    navigator.sendBeacon(utils.getApiUrl("clthdDelete.php"), formData);
  }
}

// --- Lifecycle Hooks ---
onMounted(async () => {
  spkindnoOptions.value = await utils.fetchCategories(); // 取得收貨類別選項

  await setMode("view");

  utils.handleUrlParams(setMode); // 處理URL中的參數，並自動切換到對應的模式

  window.addEventListener("beforeunload", handleBeforeUnload);
  window.addEventListener("pagehide", handlePageHide);
});

onBeforeUnmount(() => {
  window.removeEventListener("beforeunload", handleBeforeUnload);
  window.removeEventListener("pagehide", handlePageHide);
});
</script>

<style src="@/assets/vCustom.css" scoped></style>
