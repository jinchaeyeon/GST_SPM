export class List<T> {
  private items: Array<T>;

  constructor() {
    this.items = [];
  }

  size(): number {
    return this.items.length;
  }

  add(value: T): Array<T> {
    this.items.push(value);
    return this.items;
  }

  get(index: number): T {
    return this.items[index];
  }

  remove(index: number): Array<T> {
    this.items.splice(index, 1);
    return this.items;
  }
}

export interface Iparameters {
  procedureName: string;
  pageNumber: number;
  pageSize: number;
  parameters: {};
}

export type TLoginResult = {
  userId: string;
  langCode: "ko-KR" | "en-US" | "zh-CN" | "ja-JP";
  userName: string;
  role: string;
  companyCode: string;
  serviceName: string;
  customerName: string;
  loginKey: string;
};

export type TCommonCode = {
  sub_code: string;
  code_name: string;
};

export type TSessionItem = {
  code: TSessionItemCode;
  value: string;
};

// Ok (정상)
// Expired (만료됨) → 반드시 비밀번호 변경
// BeforeExpiry (만료전) → 비밀번호 변경 알림
// Initial (초기값) → 반드시 비밀번호 변경
export type TPasswordExpirationInfo = {
  status: "Ok" | "Expired" | "BeforeExpiry" | "Initial";
  useExpiration: boolean;
  lastChangePasswordDate: string;
  expirationDate: string;
  remainingDays: number;
};
export type TPasswordRequirements = {
  useExpiration: boolean;
  expirationPeriodMonths: number;
  minimumLength: number;
  useSpecialChar: boolean;
  useChangeNext: boolean;
  useAccessRestriction: boolean;
  maximumNumberOfWrongs: number;
  useNotifyBeforePeriod: boolean;
  notifyBeforePeriodDays: number;
};

export type TSessionItemCode =
  | "user_id"
  | "user_name"
  | "orgdiv"
  | "location"
  | "position"
  | "dptcd";

export type TPermissions = {
  view: boolean;
  save: boolean;
  delete: boolean;
  print: boolean;
};

export type TGrid = {
  gridName: string;
  columns: Array<TColumn>;
};

export type TColumn = {
  id: string;
  field: string;
  caption: string;
  width: number;
  fixed?: "None" | "Left" | "Right";
};

export type TControlObj = {
  rowstatus: string;
  form_id: string;
  control_name: string;
  field_name: string;
  parent: string;
  type: string;
  word_id: string;
  word_text: string;
};

export type TMenu = {
  level: number;
  menuId: string;
  menuName: string;
  parentMenuId: string;
  formId: string;
  assemblyFile: string;
  fileFolder: string;
  parameterInfo: string;
  releaseStatus: string;
  menuCategory: string;
  sort: number;
  isFavorite: boolean;
};

export type TPath = {
  path: string;
  menuName: string;
  index: string;
  menuId: string;
  parentMenuId: string;
  menuCategory: string;
  isFavorite: boolean;
};

// TypeScript에서 string key로 객체에 접근하기 위한 객체 타입
export type TObject = {
  [key: string]: string;
};

export type TLogParaVal = {
  work_type: string;
  form_id: string;
  form_name: string;
  form_login_key: string;
};

export type TSysMessageKey =
  | "QuestionToDeleteAllDataInCodeWithFormat"
  | "RequiredFieldWithFormat"
  | "DataAlreadyExistsWithFormat"
  | "ChildDataExistsAndCannotBeDeletedWithFormat"
  | "CheckImageSize"
  | "CurrentPasswordsDoesNotMatch"
  | "FileCouldNotBeFoundWithFormat"
  | "NoDataToBeSave"
  | "NoObjectToBeProcessed"
  | "NoMenuSelected"
  | "NoRowSelected"
  | "PasswordToBeChangedDoesNotMatch"
  | "QuestionToDelete"
  | "QuestionToDeleteWithFormat"
  | "ProcessingSuccess"
  | "SaveSuccess"
  | "ProcessingFailed"
  | "SaveFailed"
  | "SynonymsExist"
  | "NoFunctionSelected"
  | "NoProcedureSelected"
  | "NoServiceSelected"
  | "CannotBeDeleteDeployedMenu"
  | "DeploymentHistoryExistsAndOnlySomeFieldsAreModified"
  | "ObjectDataNotFoundWithFormat"
  | "ProcedureCreateSuccessWithFormat"
  | "ProcedureSaveSuccess"
  | "CannotCopyForViewType"
  | "UnableToCreateTable"
  | "FailedToSaveTableData"
  | "TableDoesNotExist"
  | "DataLossWarningAndQuestionToContinue"
  | "QuestionToDeleteTableWithFormat"
  | "TableCreateSuccessWithFormat"
  | "TableDataSaveSuccess"
  | "CheckPassword"
  | "StartCharacterMustBeAlphabetic"
  | "ProjectAlreadyCreated"
  | "QuestionAboutOverwritingFormInformation"
  | "TemplateNotFound"
  | "FailedToCreateForm"
  | "FormCreateSuccess"
  | "FailedToSaveDesignInfo"
  | "FailedToApplyCode"
  | "AreaToApplyCodeNotFound"
  | "InvalidTargetSelected"
  | "UnableToContactServer"
  | "QuestionToExitProgram"
  | "QuestionToLogout"
  | "InvalidIdOrPassword"
  | "NoDataSelected"
  | "QuestionToLossOfUnsavedData"
  | "QuestionToLossOfUnsavedDataWithFormat"
  | "PleaseEnterWithFormat"
  | "QuestionToExitAllMenu"
  | "ProgramNotFound"
  | "UpdateComponentNotFound"
  | "FailedToDownloadFile"
  | "FailedToDownloadFileWithFormat"
  | "Processing"
  | "AssemblyNotFound"
  | "AssemblyNotFoundWithFormat"
  | "AssemblyNotFoundForPopupForm"
  | "AppliedWhenTheProgramIsReopened"
  | "MessageSent"
  | "InvalidDomain"
  | "DisallowedIPAddress"
  | "DisabledDomain"
  | "NoIdOrPasswordSet"
  | "FailedToGetOutputResultFromServer"
  | "IncorrectIdAndPasswordSettingInfo"
  | "AttachFilesUsingDragAndDrop"
  | "QuestionToExitUnsavedData"
  | "AlreadyRunning"
  | "FailedToGetServerTime"
  | "InvalidLoginInformation"
  | "InvalidLoginInformationOfPlusWin6"
  | "FailedToCreateLog"
  | "FailedToInsertDataInBizDb"
  | "FailedToInsertDeployedMenuData"
  | "FailedToQueryStoredProcedureInfo"
  | "ErrorInProcess"
  | "CannotAddDuplicateData"
  | "NoDataToModify"
  | "NoDataToDelete"
  | "ErrorInRetrieve"
  | "AlreadyDeletedOrCannotBeDeleted"
  | "ErrorInRegister"
  | "ErrorInModify"
  | "ErrorInDelete"
  | "RetrieveSuccess"
  | "DeleteSuccess"
  | "ModifySuccess"
  | "NoDataRetrieved"
  | "NoDataRegistered"
  | "NoDataDeleted"
  | "NoDataModified"
  | "FailedToDeleteFileWithFormat"
  | "OnlyUploadersCanBeDeleted"
  | "FileDownloaded"
  | "ErrorInCreateNewKey"
  | "InitializeSearchParameters"
  | "NoPasswordRequirementData"
  | "PasswordRequirementSpecialChar"
  | "PasswordRequirementLength"
  | "InvalidUserId"
  | "PleaseEnterNewPassword"
  | "NoDataRetrievedWithFormat"
  | "FailedToInitializeBizComponent"
  | "FailedToInitializeBizComponentWithFormat"
  | "InvalidObjectWithFormat"
  | "QuestionToOpenSavedFile"
  | "NoDataSelectedWithFormat"
  | "FailedToLoadFormBasicInfo"
  | "DeleteOnlyCreator"
  | "ModifyOnlyCreator"
  | "AfterSavingNewDataCanRegisterComments"
  | "FailedToRetrieveData"
  | "FailedToRetrieveDataWithFormat"
  | "LoginAuthenticationExpiration"
  | "PasswordInputExceeded";

export type TSysCaptionKey =
  | "Administrator"
  | "Assembly"
  | "BizComponent"
  | "BizComponentId"
  | "BizComponentMulti"
  | "BizComponentName"
  | "BusinessWord"
  | "Category"
  | "Center"
  | "ChangePassword"
  | "CodeInfo"
  | "ColumnLength"
  | "CommonPopup"
  | "ComponentId"
  | "ComponentName"
  | "ConfirmPassword"
  | "ControlType"
  | "CopyPermissions"
  | "CurrentPassword"
  | "CustomerName"
  | "DataComponent"
  | "DataComponentMulti"
  | "DataType"
  | "DataUnregisteredGroup"
  | "DCCode"
  | "DefaultWord"
  | "Deploy"
  | "DeployAssembly"
  | "DeployDate"
  | "DeployLog"
  | "DeployMenu"
  | "DeploySP"
  | "DeployTarget"
  | "Description"
  | "Developing"
  | "Development"
  | "ExcelMailMerge"
  | "Field"
  | "FormId"
  | "FormInfo"
  | "FormMessage"
  | "FormName"
  | "FormSize"
  | "FormTemplate"
  | "FunctionName"
  | "FunctionType"
  | "General"
  | "GeneralUser"
  | "GenerationType"
  | "GridColumnCaption"
  | "Group"
  | "GroupCode"
  | "Help"
  | "Hidden"
  | "Home"
  | "InitData"
  | "InitPopupData"
  | "LabalCaption"
  | "Left"
  | "Management"
  | "Memo"
  | "MenuEdit"
  | "MenuId"
  | "MenuName"
  | "Modeling"
  | "Namespace"
  | "NotUsing"
  | "Operation"
  | "OtherWord"
  | "ParentGroup"
  | "ParentMenu"
  | "PasswordToChange"
  | "PopupCaption"
  | "PopupForm"
  | "ProgramGroup"
  | "ProjectConfig"
  | "ReferenceTarget"
  | "ReleaseStatus"
  | "Right"
  | "ScalarFunction"
  | "ServiceInfo"
  | "ServiceManagement"
  | "ServiceName"
  | "ServiceSelectionPopup"
  | "SpDescription"
  | "SpEdit"
  | "SpMessage"
  | "SpName"
  | "SpTemplate"
  | "StandardInfo"
  | "StoredProcedure"
  | "System"
  | "Table"
  | "TableDescription"
  | "TableFunction"
  | "TableInfo"
  | "TableName"
  | "TemplateFileName"
  | "TemplateId"
  | "TemplateName"
  | "Tool"
  | "Type"
  | "Used"
  | "UserInfo"
  | "UserType"
  | "Using"
  | "WordGroup"
  | "WordId"
  | "WordText"
  | "WordType"
  | "CodeName"
  | "NewFormInfo"
  | "New"
  | "Copy"
  | "Retrieve"
  | "Save"
  | "Delete"
  | "Close"
  | "Preview"
  | "Print"
  | "Option"
  | "HideOrShowMenu"
  | "FormOpen"
  | "Domain"
  | "Id"
  | "Password"
  | "BrowserOption"
  | "DesignInfo"
  | "ShortcutSettings"
  | "UserId"
  | "UserName"
  | "Bank"
  | "Cancel"
  | "Confirm"
  | "RegisterTransferBasicInfo"
  | "PasswordChangeNotice"
  | "ChangeNextTime"
  | "ChangeNow"
  | "NewPassword"
  | "CompanyCode"
  | "Information"
  | "Login"
  | "DeployLogByMenu"
  | "Date"
  | "EnableAlwaysOpenNewTab"
  | "ProgramOption"
  | "MenuGroup"
  | "Logout"
  | "EnableAutoLogin"
  | "GroupCodeName"
  | "SummaryInfo"
  | "MoreInfo"
  | "BasicInfo"
  | "SortOrder"
  | "RegisteredUser"
  | "RegisteredDate"
  | "RegisteredPc"
  | "ModifiedUser"
  | "ModifiedDate"
  | "ModifiedPc"
  | "Menu"
  | "WordReferencePopup"
  | "TemplateImage"
  | "CreateNewFormProject"
  | "ApplyCode"
  | "CopyToClipboard"
  | "Code"
  | "Value"
  | "Caption"
  | "CustomizationOptionPopup"
  | "Default"
  | "DefaultSetting"
  | "OptionId"
  | "OptionName"
  | "Remarks"
  | "ColumnSetting"
  | "AdminOnly"
  | "ExtraField"
  | "NumericReferenceField"
  | "DateCreated"
  | "Writer"
  | "Export"
  | "Import"
  | "Shortcut"
  | "DataRegistrationInfo"
  | "WordManagement"
  | "DeployFunction"
  | "ExcelMailMergeConfig"
  | "ExcelMailMergePrintout";
