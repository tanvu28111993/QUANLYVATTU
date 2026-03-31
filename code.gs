
// --- CẤU HÌNH ---
var ID_SHEET_DANG_NHAP = "1ma7ZRlSGmdh4BtPc6Y3blDABpxkqzrDcOhywquliBYw"; 
var ID_SHEET_KHO = "1DSg_2nJoPkAfudCy4QnHBEbvKhwHm-j6Cd9CK_cwfkg";
var ID_SHEET_DANHMUC = "1mn8QLCcgmCUKKckGXIyRcghDnPPtBAgjuGsVLJaDTF4"; 
var ID_SHEET_LICH = "11FIvb9hXe98TYOg6X4REjQyrgzdLOBfXOCM-gLIUVdA";

// External History Sheets
var ID_SHEET_XUAT = "1ztt84ZUrGk1NlhjmbdAIm6tjlGHZBRDMPgOEQi24CUw";
var ID_SHEET_NHAP = "1hmmrdoyEVPS0EIPGH5_PZjzVqN-gUfrP1Q73W6ck9b0";
var ID_SHEET_SKUN = "1HfJ6c48d0BhIsdKdCIZdq6JOBC7UHrszv-A8eI45ORM"; 

// --- CACHE CONFIG ---
var CACHE_EXPIRATION_SEC = 300; 
var CACHE_KEY_PREFIX = "INVENTORY_CHUNK_";
var CACHE_META_KEY = "INVENTORY_META";
var CACHE_USERS_KEY = "USERS_DATA";
var CACHE_METADATA_KEY = "METADATA_DATA";

// Helper để parse params từ Event
function getParams(e) {
  var params = e.parameter || {};
  if (e.postData && e.postData.contents) {
    try {
      var jsonBody = JSON.parse(e.postData.contents);
      for (var key in jsonBody) {
        params[key] = jsonBody[key];
      }
    } catch (err) {}
  }
  return params;
}

function doGet(e) {
  try {
    var params = getParams(e);
    return routeRequest(params);
  } catch (err) {
    return responseJSON({ error: "Global Error: " + err.message });
  }
}

function doPost(e) {
  try {
    var params = getParams(e);
    // Read-only mode: No batch processing or updates allowed via POST for now, 
    // unless it's a read operation disguised as POST (though typically GET is used for reads).
    // We route everything through the same router.
    return routeRequest(params);
  } catch (err) {
    return responseJSON({ error: "Global Error: " + err.message });
  }
}

// Router điều hướng request
function routeRequest(params) {
  var action = params.action ? String(params.action).trim() : "";
  
  if (action == 'login') return handleLogin(params);
  if (action == 'getUsers') return handleGetUsers();
  if (action == 'updateUser') return handleUpdateUser(params);
  if (action == 'getInventory') return handleGetInventory(params);
  if (action == 'getHistory') return handleGetHistory(params); 
  if (action == 'getMetaData') return handleGetMetaData(); 
  if (action == 'updateMetaData') return handleUpdateMetaData(params);
  if (action == 'checkVersion') return handleCheckVersion();
  if (action == 'getSchedule') return handleGetSchedule();
  if (action == 'saveSchedule') return handleSaveSchedule(params);
  if (action == 'batch') return handleBatch(params);
  if (action == 'ping') return responseJSON({ success: true, message: "Pong", time: Date.now() });
  if (action == 'checkHealth') return handleCheckHealth();
  
  return responseJSON({ error: "Invalid action or Read-Only Mode: " + action });
}

function handleBatch(params) {
  // Read-only optimization: Immediately return success
  return responseJSON({ success: true, message: "Read-only mode: Batch processed (simulated)" });
}

function handleImport(payload) {
    return { success: true };
}

function handleUpdate(payload) {
    return { success: true };
}

function handleUpdateMetaData(params) {
    try {
      var cache = CacheService.getScriptCache();
      cache.remove(CACHE_METADATA_KEY);
    } catch (e) {}
    return responseJSON({ success: true, message: "Read-only mode: Metadata updated (simulated)" });
}

function handleSaveSchedule(params) {
    return responseJSON({ success: true, message: "Read-only mode: Schedule saved (simulated)" });
}


function handleCheckHealth() {
  var status = {};
  var ids = {
    "DANG_NHAP": ID_SHEET_DANG_NHAP,
    "KHO": ID_SHEET_KHO,
    "DANHMUC": ID_SHEET_DANHMUC,
    "LICH": ID_SHEET_LICH,
    "XUAT": ID_SHEET_XUAT,
    "NHAP": ID_SHEET_NHAP,
    "SKUN": ID_SHEET_SKUN
  };
  
  for (var key in ids) {
    try {
      var ss = SpreadsheetApp.openById(ids[key]);
      status[key] = "OK - " + ss.getName();
    } catch (e) {
      status[key] = "ERROR - " + e.message;
    }
  }
  
  return responseJSON({ success: true, status: status });
}

function handleGetMetaData() {
  try {
    var cache = CacheService.getScriptCache();
    var cached = cache.get(CACHE_METADATA_KEY);
    if (cached) {
      return responseJSON({ success: true, data: JSON.parse(cached), fromCache: true });
    }

    var ss = SpreadsheetApp.openById(ID_SHEET_DANHMUC);
    
    var readSheet = function(sheetName, numCols) {
      var sheet = ss.getSheetByName(sheetName);
      
      // Fallback: Case-insensitive and space-insensitive search
      if (!sheet) {
          var sheets = ss.getSheets();
          for (var i = 0; i < sheets.length; i++) {
              var name = sheets[i].getName();
              // Normalize: Remove spaces, uppercase
              if (name.toUpperCase().replace(/\s/g, '') === sheetName.toUpperCase().replace(/\s/g, '')) {
                  sheet = sheets[i];
                  break;
              }
          }
      }

      if (!sheet) return [];
      var lastRow = sheet.getLastRow();
      if (lastRow < 2) return []; 
      var data = sheet.getRange(2, 1, lastRow - 1, numCols).getValues();
      return data.filter(function(row) { return row[0] && String(row[0]).trim() !== ""; });
    };

    // Debug: List all sheet names
    var allSheetNames = ss.getSheets().map(function(s) { return s.getName(); });

    var data = {
      loaiNhap: readSheet("LOAINHAP", 2),
      kienGiay: readSheet("KIENGIAY", 2),
      loaiGiay: readSheet("GIAY", 2),
      loaiVt: readSheet("LOAIVT", 2), 
      ncc: readSheet("NCC2", 3), 
      nsx: readSheet("NSX", 1),
      debugSheets: allSheetNames // Return list of sheets for debugging
    };

    // Cache the metadata
    try {
      cache.put(CACHE_METADATA_KEY, JSON.stringify(data), CACHE_EXPIRATION_SEC);
    } catch (e) {}

    return responseJSON({ success: true, data: data });
  } catch (err) {
    return responseJSON({ success: false, message: err.message, data: {} });
  }
}

function handleLogin(params) {
  var username = params.username;
  var password = params.password;
  
  if (!username || !password) return responseJSON({ success: false, message: "Thiếu thông tin" });

  // 1. Check Cache first
  var cache = CacheService.getScriptCache();
  var cachedUsers = cache.get(CACHE_USERS_KEY);
  var usersData = null;
  var headers = null;

  if (cachedUsers) {
    var parsed = JSON.parse(cachedUsers);
    usersData = parsed.data;
    headers = parsed.headers;
  } else {
    // 2. If not in cache, read from Spreadsheet
    var ss = SpreadsheetApp.openById(ID_SHEET_DANG_NHAP);
    var sheet = ss.getSheetByName("DN"); 
    if (!sheet) sheet = ss.getSheets()[0]; 

    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    if (lastRow < 2 || lastCol < 1) return responseJSON({ success: false, message: "Lỗi hệ thống hoặc chưa có dữ liệu user" });
    
    headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
    usersData = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    
    // Cache the data
    try {
      cache.put(CACHE_USERS_KEY, JSON.stringify({ data: usersData, headers: headers }), CACHE_EXPIRATION_SEC);
    } catch (e) {}
  }
  
  for (var i = 0; i < usersData.length; i++) {
    if (String(usersData[i][0]) == username && String(usersData[i][1]) == password) {
      var userObj = {
        username: username,
        password: password
      };
      for (var j = 2; j < headers.length; j++) {
        var header = headers[j];
        if (!header) continue;
        var val = usersData[i][j];
        if (val === true || String(val).toUpperCase() === 'TRUE') {
          userObj[header] = true;
        } else if (val === false || String(val).toUpperCase() === 'FALSE') {
          userObj[header] = false;
        } else {
          userObj[header] = String(val);
        }
      }
      return responseJSON({ 
        success: true, 
        user: userObj
      });
    }
  }
  return responseJSON({ success: false, message: "Sai tài khoản/mật khẩu" });
}

function handleGetUsers() {
  try {
    var cache = CacheService.getScriptCache();
    var cached = cache.get(CACHE_USERS_KEY);
    if (cached) {
      var parsed = JSON.parse(cached);
      return responseJSON({ success: true, data: parsed.data, headers: parsed.headers, fromCache: true });
    }

    var ss = SpreadsheetApp.openById(ID_SHEET_DANG_NHAP);
    var sheet = ss.getSheetByName("DN");
    if (!sheet) return responseJSON({ success: false, message: "Không tìm thấy sheet DN" });

    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    if (lastRow < 1 || lastCol < 1) return responseJSON({ success: true, data: [], headers: [] });

    var rawHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
    var headers = [];
    var validColIndices = [];
    for (var k = 0; k < rawHeaders.length; k++) {
      if (rawHeaders[k].trim() !== "") {
        headers.push(rawHeaders[k].trim());
        validColIndices.push(k);
      }
    }
    
    if (lastRow < 2) return responseJSON({ success: true, data: [], headers: headers });

    var data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    var users = [];
    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      if (!row[0]) continue; // Skip empty usernames
      var userObj = {
        username: String(row[0]),
        password: String(row[1])
      };
      for (var j = 2; j < headers.length; j++) {
        var header = headers[j];
        var colIndex = validColIndices[j];
        var val = row[colIndex];
        if (val === true || String(val).toUpperCase() === 'TRUE') {
          userObj[header] = true;
        } else if (val === false || String(val).toUpperCase() === 'FALSE') {
          userObj[header] = false;
        } else {
          userObj[header] = String(val);
        }
      }
      users.push(userObj);
    }

    // Cache the data
    try {
      cache.put(CACHE_USERS_KEY, JSON.stringify({ data: users, headers: headers }), CACHE_EXPIRATION_SEC);
    } catch (e) {}

    return responseJSON({ success: true, data: users, headers: headers });
  } catch (err) {
    return responseJSON({ success: false, message: err.message });
  }
}

function handleUpdateUser(params) {
  try {
    var operation = params.operation; // 'add', 'edit', 'delete'
    var userData = params.data; // JSON string or object
    if (typeof userData === 'string') {
      userData = JSON.parse(userData);
    }

    var ss = SpreadsheetApp.openById(ID_SHEET_DANG_NHAP);
    var sheet = ss.getSheetByName("DN");
    if (!sheet) return responseJSON({ success: false, message: "Không tìm thấy sheet DN" });

    var username = userData.username;
    if (!username) return responseJSON({ success: false, message: "Thiếu tên đăng nhập" });

    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    if (lastCol < 1) return responseJSON({ success: false, message: "Sheet không có cột nào" });
    
    var rawHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
    var headers = [];
    var validColIndices = [];
    for (var k = 0; k < rawHeaders.length; k++) {
      if (rawHeaders[k].trim() !== "") {
        headers.push(rawHeaders[k].trim());
        validColIndices.push(k);
      }
    }
    
    var data = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, 1).getValues() : [];
    
    var rowIndex = -1;
    for (var i = 0; i < data.length; i++) {
      if (String(data[i][0]) === username) {
        rowIndex = i + 2;
        break;
      }
    }

    if (operation === 'add') {
      if (rowIndex !== -1) return responseJSON({ success: false, message: "Tài khoản đã tồn tại" });
      var newRow = new Array(lastCol).fill("");
      if (validColIndices.length > 0) newRow[validColIndices[0]] = username;
      if (validColIndices.length > 1) newRow[validColIndices[1]] = userData.password || "";
      for (var j = 2; j < headers.length; j++) {
        var header = headers[j];
        var val = userData[header];
        if (val === undefined) val = ""; // Default to empty string
        newRow[validColIndices[j]] = val;
      }
      sheet.appendRow(newRow);
    } else if (operation === 'edit') {
      if (rowIndex === -1) return responseJSON({ success: false, message: "Tài khoản không tồn tại" });
      var editRow = sheet.getRange(rowIndex, 1, 1, lastCol).getValues()[0];
      if (validColIndices.length > 0) editRow[validColIndices[0]] = username;
      if (validColIndices.length > 1) editRow[validColIndices[1]] = userData.password || "";
      for (var j = 2; j < headers.length; j++) {
        var header = headers[j];
        var val = userData[header];
        if (val === undefined) val = "";
        editRow[validColIndices[j]] = val;
      }
      sheet.getRange(rowIndex, 1, 1, lastCol).setValues([editRow]);
    } else if (operation === 'delete') {
      if (rowIndex === -1) return responseJSON({ success: false, message: "Tài khoản không tồn tại" });
      sheet.deleteRow(rowIndex);
    } else {
      return responseJSON({ success: false, message: "Operation không hợp lệ" });
    }

    // Clear cache after update
    try {
      var cache = CacheService.getScriptCache();
      cache.remove(CACHE_USERS_KEY);
    } catch (e) {}

    return responseJSON({ success: true, message: "Cập nhật thành công" });
  } catch (err) {
    return responseJSON({ success: false, message: err.message });
  }
}

function handleCheckVersion() {
  var ss = SpreadsheetApp.openById(ID_SHEET_KHO);
  var sheet = ss.getSheetByName("KHO");
  var lastRow = sheet.getLastRow();
  var version = "0_0";
  if (lastRow > 1) {
    var lastUpdateCell = sheet.getRange(lastRow, 19).getValue(); 
    version = lastRow + "_" + lastUpdateCell;
  }
  return responseJSON({ version: version });
}

function parseDateStr(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return 0;
    try {
        var parts = dateStr.trim().split(' '); 
        if (parts.length === 0) return 0;
        var dateParts = parts[0].split('/');
        if (dateParts.length < 3) return 0;
        var day = +dateParts[0]; 
        var month = +dateParts[1] - 1; 
        var year = +dateParts[2];
        var hours = 0, minutes = 0, seconds = 0;
        if (parts.length > 1) {
            var timeParts = parts[1].split(':');
            if (timeParts.length >= 2) {
                hours = +timeParts[0];
                minutes = +timeParts[1];
                if (timeParts.length > 2) seconds = +timeParts[2];
            }
        }
        return new Date(year, month, day, hours, minutes, seconds).getTime();
    } catch (e) { return 0; }
}

function extractTimeFromRow(rawStr) {
  if (!rawStr || rawStr.length < 10) return 0;
  var lastPipeIndex = rawStr.lastIndexOf('|');
  if (lastPipeIndex === -1) return 0;
  var dateStr = rawStr.substring(lastPipeIndex + 1);
  return parseDateStr(dateStr) || Date.parse(dateStr) || 0;
}

function handleGetHistory(params) {
  try {
    var filterStart = params.startDate ? parseInt(params.startDate) : 0;
    var filterEnd = params.endDate ? parseInt(params.endDate) : 0;
    var page = parseInt(params.page) || 1;
    var pageSize = parseInt(params.pageSize) || 10000; 
    
    var historyData = [];

    var fetchAndFilterSheet = function(sheetId, sheetName, transactionType) {
      try {
        var ss = SpreadsheetApp.openById(sheetId);
        var sheet = ss.getSheetByName(sheetName); 
        if (!sheet) return [];
        var lastRow = sheet.getLastRow();
        if (lastRow < 2) return [];
        var data = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        var len = data.length;
        if (len === 0) return [];

        var startIndex = -1;
        var l = 0, r = len - 1;
        while (l <= r) {
          var mid = Math.floor((l + r) / 2);
          var rowTime = extractTimeFromRow(String(data[mid][0]));
          if (rowTime >= filterStart) {
            startIndex = mid;
            r = mid - 1;
          } else {
            l = mid + 1;
          }
        }
        if (startIndex === -1) return [];

        var result = [];
        for (var i = startIndex; i < len; i++) {
          var rawCell = String(data[i][0]);
          var rowTime = extractTimeFromRow(rawCell);
          if (rowTime > filterEnd) break;
          var parts = rawCell.split('|');
          var cleanRow = parts.map(function(p) { return p ? p.trim() : ""; });
          cleanRow.push(transactionType);
          result.push(cleanRow);
        }
        return result;
      } catch (e) { return []; }
    };

    var startYear = new Date(filterStart).getFullYear();
    var endYear = new Date(filterEnd).getFullYear();
    var currentYear = new Date().getFullYear();
    if (isNaN(startYear)) startYear = currentYear;
    if (isNaN(endYear)) endYear = currentYear;
    if (endYear - startYear > 3) startYear = endYear - 3;

    for (var year = startYear; year <= endYear; year++) {
        var xuatSheetName = "XUAT_" + year;
        var nhapSheetName = "NHAP_" + year;
        historyData = historyData.concat(fetchAndFilterSheet(ID_SHEET_XUAT, xuatSheetName, 'EXPORT'));
        historyData = historyData.concat(fetchAndFilterSheet(ID_SHEET_NHAP, nhapSheetName, 'IMPORT'));
    }

    historyData.sort(function(a, b) {
        var idxA = a.length - 2; 
        var idxB = b.length - 2;
        var valA = idxA >= 0 ? a[idxA] : "";
        var valB = idxB >= 0 ? b[idxB] : "";
        var dateA = typeof valA === 'string' ? (parseDateStr(valA) || Date.parse(valA) || 0) : 0;
        var dateB = typeof valB === 'string' ? (parseDateStr(valB) || Date.parse(valB) || 0) : 0;
        return dateA - dateB; 
    });

    var totalRecords = historyData.length;
    var totalPages = Math.ceil(totalRecords / pageSize);
    var startIndex = (page - 1) * pageSize;
    var pagedData = historyData.slice(startIndex, startIndex + pageSize);

    return responseJSON({
      success: true,
      data: pagedData,
      pagination: {
        page: page,
        pageSize: pageSize,
        total: totalRecords,
        totalPages: totalPages
      }
    });

  } catch (error) {
    return responseJSON({ error: error.message });
  }
}

function getCachedData() {
  try {
    var cache = CacheService.getScriptCache();
    var meta = cache.get(CACHE_META_KEY);
    if (!meta) return null;
    var metaObj = JSON.parse(meta);
    var rawData = [];
    for (var i = 0; i < metaObj.chunks; i++) {
      var chunk = cache.get(CACHE_KEY_PREFIX + i);
      if (!chunk) return null; 
      rawData = rawData.concat(JSON.parse(chunk));
    }
    return rawData;
  } catch (e) { return null; }
}

function setCachedData(data) {
  try {
    var cache = CacheService.getScriptCache();
    var arrayChunkSize = 1000; 
    var totalChunks = Math.ceil(data.length / arrayChunkSize);
    var cacheObject = {};
    for (var k = 0; k < totalChunks; k++) {
      var slice = data.slice(k * arrayChunkSize, (k + 1) * arrayChunkSize);
      cacheObject[CACHE_KEY_PREFIX + k] = JSON.stringify(slice);
    }
    cacheObject[CACHE_META_KEY] = JSON.stringify({ chunks: totalChunks });
    cache.putAll(cacheObject, CACHE_EXPIRATION_SEC);
  } catch (e) {}
}

function handleGetInventory(params) {
  var rawData = getCachedData();
  var isFromCache = true;

  if (!rawData) {
    var ss = SpreadsheetApp.openById(ID_SHEET_KHO);
    var sheet = ss.getSheetByName("KHO");
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return responseJSON({ data: [], serverTimestamp: Date.now() });
    rawData = sheet.getRange(2, 1, lastRow - 1, 19).getValues();
    setCachedData(rawData);
    isFromCache = false;
  }

  var lastClientTime = Number(params.lastUpdated) || 0;
  var optimizedData = [];
  var len = rawData.length;
  var maxTimestamp = 0; 

  for (var i = 0; i < len; i++) {
    var row = rawData[i];
    if (!row[0]) continue; 
    var rowTime = 0;
    var lastUpdatedVal = row[18];
    if (typeof lastUpdatedVal === 'string' && lastUpdatedVal.includes('T')) {
        rowTime = new Date(lastUpdatedVal).getTime();
    } else if (lastUpdatedVal instanceof Date) {
        rowTime = lastUpdatedVal.getTime();
    } else if (typeof lastUpdatedVal === 'string' && lastUpdatedVal.trim() !== "") {
        rowTime = new Date(lastUpdatedVal).getTime();
    }
    if (!isNaN(rowTime) && rowTime > maxTimestamp) maxTimestamp = rowTime;

    if (rowTime > lastClientTime) {
      optimizedData.push([
        String(row[0]), String(row[1]), String(row[2]), String(row[3]), String(row[4] || ""),
        String(row[5]), String(row[6]), row[7], row[8], Number(row[9]) || 0,
        Number(row[10]) || 0, Number(row[11]) || 0, Number(row[12]) || 0, String(row[13]),
        String(row[14]), String(row[15]), String(row[16] || ""), String(row[17]), row[18]
      ]);
    }
  }
  if (maxTimestamp === 0) maxTimestamp = Date.now();
  return responseJSON({
    serverTimestamp: maxTimestamp,
    data: optimizedData,
    cached: isFromCache 
  });
}

function handleGetSchedule() {
  try {
    var ss = SpreadsheetApp.openById(ID_SHEET_LICH);
    var sheet = ss.getSheetByName("LICH");
    if (!sheet) return responseJSON({ success: true, data: [] });

    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return responseJSON({ success: true, data: [] });

    // Read column A only
    var data = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    var scheduleItems = [];

    for (var i = 0; i < data.length; i++) {
      var raw = String(data[i][0]);
      if (!raw) continue;
      
      var parts = raw.split('|');
      // id|materialType|purchaseDate|purchaseOrder|supplierCode|supplierName|materialName|orderCustomer|gsm|rollWidth|length|width|quantity|unit|expectedArrivalDate|packetType|paperType|manufacturer|importer|updatedAt
      
      if (parts.length < 1) continue;

      var item = {
        id: parts[0] || "",
        purchaseOrder: parts[1] || "",
        materialType: parts[2] || "",
        supplierCode: parts[3] || "",
        supplierName: parts[4] || "",
        materialCode: parts[5] || "",
        materialName: parts[6] || "",
        orderCustomer: parts[7] || "",
        packetType: parts[8] || "",
        paperType: parts[9] || "",
        manufacturer: parts[10] || "",
        purchaseDate: parts[11] || "",
        gsm: Number(parts[12]) || 0,
        rollWidth: Number(parts[13]) || 0,
        length: Number(parts[14]) || 0,
        width: Number(parts[15]) || 0,
        quantity: Number(parts[16]) || 0,
        unit: parts[17] || "",
        expectedArrivalDate: parts[18] || "",
        importer: parts[19] || "",
        updatedAt: parts[20] || ""
      };
      scheduleItems.push(item);
    }

    return responseJSON({ success: true, data: scheduleItems });
  } catch (e) {
    return responseJSON({ success: false, message: e.message });
  }
}

function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
