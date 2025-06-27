import * as utils from "@/utils/utils.js";

export function useTableColumnConfig(
  mode,
  labels,
  isFieldValid,
  getInvalidGroupNames,
  handleFocus,
  handleBlur,
  isFieldDisabled,
  isFocusMechanismActive,
  updateTable,
  setFieldRef
) {
  const numberColumnsConfig = (
    decimalPlaces = 4,
    isSetNegativeToZero = true
  ) => ({
    // 數字欄位的通用配置
    getProps: (item, key) => ({
      ref: setFieldRef(`field_${item["NA.cldhditm.id"]}_${key}`),
      readonly: mode.value === "view" || isFieldDisabled(item, key),
      class: labels.value[key]?.dataType === "number" ? "number-field" : "",
      error:
        !isFieldValid(item[key], key) ||
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
        utils.handleField(item, key, decimalPlaces, isSetNegativeToZero);
        updateTable(item, key);
      },
    }),
  });

  const textColumnsConfig = () => ({
    // 文本欄位的通用配置
    getProps: (item, key) => ({
      readonly: mode.value === "view" || isFieldDisabled(item, key),
      class: labels.value[key]?.dataType === "text" ? "text-field" : "",
      error:
        !isFieldValid(item[key], key) ||
        labels.value[key].validationGroup === getInvalidGroupNames(item)[0],
      "error-messages":
        isFocusMechanismActive.value && !isFieldDisabled(item, key)
          ? "必填"
          : labels.value[key].validationGroup === getInvalidGroupNames(item)[0]
          ? "擇一填寫"
          : null,
    }),
    getEvents: (item, key) => ({
      change: () => {
        updateTable(item, key);
      },
    }),
  });

  const dateColumnsConfig = () => ({
    // 日期欄位的通用配置
    getProps: (item, key) => ({
      ref: setFieldRef(`field_${item["NA.cldhditm.id"]}_${key}`),
      type: "date",
      readonly: mode.value === "view" || isFieldDisabled(item, key),
      error:
        !isFieldValid(item[key], key) ||
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
        updateTable(item, key);
      },
    }),
  });

  return { numberColumnsConfig, textColumnsConfig, dateColumnsConfig };
}
