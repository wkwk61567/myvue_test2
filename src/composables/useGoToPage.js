import { useRouter } from "vue-router";

export function useGoToPage(pagePath, selectedRow, keyAudit) {
  const router = useRouter();

  const goToPage = (dannoParam, query = {}) => {
    if (query?.mode === "edit") {
      if (selectedRow.value === null) {
        alert("請選擇一筆資料");
        return;
      }
      if (
        !(
          selectedRow.value[keyAudit] === null ||
          selectedRow.value[keyAudit] === ""
        )
      ) {
        alert("此單已審核，不能修改");
        return;
      }
    }

    // 使用 window.open 開啟新分頁
    const url = router.resolve({
      path: `${pagePath}/${dannoParam}`,
      query: query,
    }).href;
    window.open(url, "_blank");
  };

  return { goToPage };
}
