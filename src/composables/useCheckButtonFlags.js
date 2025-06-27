import { ref } from "vue";
import * as utils from "@/utils/utils.js";

export function useCheckButtonFlags(formno, audit) {
  const isAddDisabled = ref(true);
  const isEditDisabled = ref(true);
  const isDeleteOrderDisabled = ref(true);
  const isToggleAuditDisabled = ref(true);
  const isExportExcelDisabled = ref(true);
  const isPrintOrderDisabled = ref(true);

  async function checkButtonFlags() {
    // 檢查按鈕是否禁用
    isAddDisabled.value = !(await utils.checkFlag("addflag", formno));
    isEditDisabled.value = !(await utils.checkFlag("editflag", formno));
    isDeleteOrderDisabled.value = !(await utils.checkFlag(
      "deleteflag",
      formno
    ));
    if (audit === null || audit === "") {
      isToggleAuditDisabled.value = !(await utils.checkFlag(
        "auditflag",
        formno
      ));
    } else {
      isToggleAuditDisabled.value = !(await utils.checkFlag(
        "unauditflag",
        formno
      ));
    }
    isExportExcelDisabled.value = !(await utils.checkFlag("excelflag", formno));
    isPrintOrderDisabled.value = !(await utils.checkFlag("printflag", formno));
  }
  

  return {
    isAddDisabled,
    isEditDisabled,
    isDeleteOrderDisabled,
    isToggleAuditDisabled,
    isExportExcelDisabled,
    isPrintOrderDisabled,
    checkButtonFlags,
  };
}
