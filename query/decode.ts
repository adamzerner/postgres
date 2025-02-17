import { Oid } from "./oid.ts";
import { bold, yellow } from "../deps.ts";
import {
  decodeBigint,
  decodeBigintArray,
  decodeBoolean,
  decodeBooleanArray,
  decodeBox,
  decodeBoxArray,
  decodeBytea,
  decodeByteaArray,
  decodeCircle,
  decodeCircleArray,
  decodeDate,
  decodeDateArray,
  decodeDatetime,
  decodeDatetimeArray,
  decodeFloat,
  decodeFloatArray,
  decodeInt,
  decodeIntArray,
  decodeJson,
  decodeJsonArray,
  decodeLine,
  decodeLineArray,
  decodeLineSegment,
  decodeLineSegmentArray,
  decodePath,
  decodePathArray,
  decodePoint,
  decodePointArray,
  decodePolygon,
  decodePolygonArray,
  decodeStringArray,
  decodeTid,
  decodeTidArray,
} from "./decoders.ts";
import { ClientControls } from "../connection/connection_params.ts";

export class Column {
  constructor(
    public name: string,
    public tableOid: number,
    public index: number,
    public typeOid: number,
    public columnLength: number,
    public typeModifier: number,
    public format: Format,
  ) {}
}

enum Format {
  TEXT = 0,
  BINARY = 1,
}

const decoder = new TextDecoder();

// TODO
// Decode binary fields
function decodeBinary() {
  throw new Error("Decoding binary data is not implemented!");
}

function decodeText(value: Uint8Array, typeOid: number) {
  const strValue = decoder.decode(value);

  try {
    switch (typeOid) {
      case Oid.bpchar:
      case Oid.char:
      case Oid.cidr:
      case Oid.float8:
      case Oid.inet:
      case Oid.macaddr:
      case Oid.name:
      case Oid.numeric:
      case Oid.oid:
      case Oid.regclass:
      case Oid.regconfig:
      case Oid.regdictionary:
      case Oid.regnamespace:
      case Oid.regoper:
      case Oid.regoperator:
      case Oid.regproc:
      case Oid.regprocedure:
      case Oid.regrole:
      case Oid.regtype:
      case Oid.text:
      case Oid.time:
      case Oid.timetz:
      case Oid.uuid:
      case Oid.varchar:
      case Oid.void:
        return strValue;
      case Oid.bpchar_array:
      case Oid.char_array:
      case Oid.cidr_array:
      case Oid.float8_array:
      case Oid.inet_array:
      case Oid.macaddr_array:
      case Oid.name_array:
      case Oid.numeric_array:
      case Oid.oid_array:
      case Oid.regclass_array:
      case Oid.regconfig_array:
      case Oid.regdictionary_array:
      case Oid.regnamespace_array:
      case Oid.regoper_array:
      case Oid.regoperator_array:
      case Oid.regproc_array:
      case Oid.regprocedure_array:
      case Oid.regrole_array:
      case Oid.regtype_array:
      case Oid.text_array:
      case Oid.time_array:
      case Oid.timetz_array:
      case Oid.uuid_array:
      case Oid.varchar_array:
        return decodeStringArray(strValue);
      case Oid.float4:
        return decodeFloat(strValue);
      case Oid.float4_array:
        return decodeFloatArray(strValue);
      case Oid.int2:
      case Oid.int4:
      case Oid.xid:
        return decodeInt(strValue);
      case Oid.int2_array:
      case Oid.int4_array:
      case Oid.xid_array:
        return decodeIntArray(strValue);
      case Oid.bool:
        return decodeBoolean(strValue);
      case Oid.bool_array:
        return decodeBooleanArray(strValue);
      case Oid.box:
        return decodeBox(strValue);
      case Oid.box_array:
        return decodeBoxArray(strValue);
      case Oid.circle:
        return decodeCircle(strValue);
      case Oid.circle_array:
        return decodeCircleArray(strValue);
      case Oid.bytea:
        return decodeBytea(strValue);
      case Oid.byte_array:
        return decodeByteaArray(strValue);
      case Oid.date:
        return decodeDate(strValue);
      case Oid.date_array:
        return decodeDateArray(strValue);
      case Oid.int8:
        return decodeBigint(strValue);
      case Oid.int8_array:
        return decodeBigintArray(strValue);
      case Oid.json:
      case Oid.jsonb:
        return decodeJson(strValue);
      case Oid.json_array:
      case Oid.jsonb_array:
        return decodeJsonArray(strValue);
      case Oid.line:
        return decodeLine(strValue);
      case Oid.line_array:
        return decodeLineArray(strValue);
      case Oid.lseg:
        return decodeLineSegment(strValue);
      case Oid.lseg_array:
        return decodeLineSegmentArray(strValue);
      case Oid.path:
        return decodePath(strValue);
      case Oid.path_array:
        return decodePathArray(strValue);
      case Oid.point:
        return decodePoint(strValue);
      case Oid.point_array:
        return decodePointArray(strValue);
      case Oid.polygon:
        return decodePolygon(strValue);
      case Oid.polygon_array:
        return decodePolygonArray(strValue);
      case Oid.tid:
        return decodeTid(strValue);
      case Oid.tid_array:
        return decodeTidArray(strValue);
      case Oid.timestamp:
      case Oid.timestamptz:
        return decodeDatetime(strValue);
      case Oid.timestamp_array:
      case Oid.timestamptz_array:
        return decodeDatetimeArray(strValue);
      default:
        // A separate category for not handled values
        // They might or might not be represented correctly as strings,
        // returning them to the user as raw strings allows them to parse
        // them as they see fit
        return strValue;
    }
  } catch (_e) {
    console.error(
      bold(yellow(`Error decoding type Oid ${typeOid} value`)) +
        _e.message +
        "\n" +
        bold("Defaulting to null."),
    );
    // If an error occurred during decoding, return null
    return null;
  }
}

export function decode(
  value: Uint8Array,
  column: Column,
  controls?: ClientControls,
) {
  if (column.format === Format.BINARY) {
    return decodeBinary();
  } else if (column.format === Format.TEXT) {
    // If the user has specified a decode strategy, use that
    if (controls?.decodeStrategy === "string") {
      return decoder.decode(value);
    }
    // default to 'auto' mode, which uses the typeOid to determine the decoding strategy
    return decodeText(value, column.typeOid);
  } else {
    throw new Error(`Unknown column format: ${column.format}`);
  }
}
