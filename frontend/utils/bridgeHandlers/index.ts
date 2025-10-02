// Add new bridge handlers by creating a file that exports `BRIDGE_FUNCTION` (of shape { topic, handler })
// and then import and include it in this file's BRIDGE_REGISTRY array.

import { BRIDGE_FUNCTION as token } from "./token";
import { BRIDGE_FUNCTION as user_id } from "./user_id";
import { BRIDGE_FUNCTION as qr_request } from "./qr_request";
import { BRIDGE_FUNCTION as alert } from "./alert";
import { BRIDGE_FUNCTION as confirm_alert } from "./confirm_alert";
import { BRIDGE_FUNCTION as save_local_data } from "./save_local_data";
import { BRIDGE_FUNCTION as get_local_data } from "./get_local_data";
import { BRIDGE_FUNCTION as micro_app_token } from "./micro_app_token";
import { BRIDGE_FUNCTION as security_audit } from "./security_audit";

export const BRIDGE_REGISTRY = [
  token,
  user_id,
  qr_request,
  alert,
  confirm_alert,
  save_local_data,
  get_local_data,
  micro_app_token,
  security_audit,
];
