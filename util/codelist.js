import {querySudo as query} from "@lblod/mu-auth-sudo";
import {retrieveCodeListQuery} from "./queries";

export const DECISION_TYPES = 'http://lblod.data.gift/concept-schemes/71e6455e-1204-46a6-abf4-87319f58eaa5';
export const REGULATION_TYPES = 'http://lblod.data.gift/concept-schemes/c93ccd41-aee7-488f-86d3-038de890d05a';
export const TAX_TYPES = 'http://lblod.data.gift/concept-schemes/3037c4f4-1c63-43ac-bfc4-b41d098b15a6';


export async function retrieveCodeList(uri){
  try {
    const result = await query(retrieveCodeListQuery(uri));
    if (result.results.bindings.length) {
      return result.results.bindings.map(binding => binding['concept'].value );
    } else {
      console.log(`no code-list could be found for ${uri}`);
      return null;
    }
  } catch (e) {
    console.log(`Something went wrong while trying to retrieving the code-list.`);
    console.log(`Exception: ${e.stack}`);
    return null;
  }
}