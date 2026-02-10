
// --- CẤU HÌNH ---
var ID_SHEET_DANG_NHAP = "1tjkaHslFfyfeDG6Vf4Ywe12demDjnrFxOyqELy7fLB8"; // Updated Login Sheet
var ID_SHEET_KHO = "1DSg_2nJoPkAfudCy4QnHBEbvKhwHm-j6Cd9CK_cwfkg";
var ID_SHEET_DANHMUC = "1mn8QLCcgmCUKKckGXIyRcghDnPPtBAgjuGsVLJaDTF4"; 

// External History Sheets (Giữ lại để ghi lịch sử nếu cần thiết trong tương lai)
var ID_SHEET_XUAT = "1ztt84ZUrGk1NlhjmbdAIm6tjlGHZBRDMPgOEQi24CUw";
var ID_SHEET_NHAP = "1hmmrdoyEVPS0EIPGH5_PZjzVqN-gUfrP1Q73W6ck9b0";
var ID_SHEET_SKUN = "1HfJ6c48d0BhIsdKdCIZdq6JOBC7UHrszv-A8eI45ORM"; 

// --- CACHE CONFIG ---
var CACHE_EXPIRATION_SEC = 300; 
var CACHE_KEY_PREFIX = "INVENTORY_CHUNK_";
var CACHE_META_KEY = "INVENTORY_META";

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
  var params = getParams(e);
  return routeRequest(params);
}

function doPost(e) {
  var params = getParams(e);
  var action = params.action;

  // --- OPTIMIZATION: SEPARATE READ/WRITE LOGIC (CQRS) ---
  if (action === 'batch') {
      var lock = LockService.getScriptLock();
      try {
        lock.waitLock(30000);
        return handleBatch(params);
      } catch (e) {
        return responseJSON({ success: false, message: "Server Busy. Try again later." });
      } finally {
        lock.releaseLock();
      }
  }

  return routeRequest(params);
}

// Router điều hướng request
function routeRequest(params) {
  var action = params.action;
  if (action == 'login') return handleLogin(params);
  if (action == 'getInventory') return handleGetInventory(params);
  if (action == 'getHistory') return handleGetHistory(params); 
  if (action == 'getMetaData') return handleGetMetaData(); 
  if (action == 'updateMetaData') return handleUpdateMetaData(params);
  if (action == 'checkVersion') return handleCheckVersion();
  
  return responseJSON({ error: "Invalid action" });
}

function handleGetMetaData() {
  try {
    var ss = SpreadsheetApp.openById(ID_SHEET_DANHMUC);
    
    var readSheet = function(sheetName, numCols) {
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) return [];
      var lastRow = sheet.getLastRow();
      if (lastRow < 2) return []; 
      var data = sheet.getRange(2, 1, lastRow - 1, numCols).getValues();
      return data.filter(function(row) { return row[0] && String(row[0]).trim() !== ""; });
    };

    var data = {
      loaiNhap: readSheet("LOAINHAP", 2),
      kienGiay: readSheet("KIENGIAY", 2),
      loaiGiay: readSheet("GIAY", 2),    
      ncc: readSheet("NCC2", 3), // NCC2 đọc 3 cột
      nsx: readSheet("NSX", 1)           
    };

    return responseJSON({ success: true, data: data });
  } catch (err) {
    return responseJSON({ success: false, message: err.message, data: {} });
  }
}

// Hàm xử lý Thêm/Xóa/Sửa Metadata
function handleUpdateMetaData(params) {
    var lock = LockService.getScriptLock();
    try {
        lock.waitLock(30000);
        
        var category = params.category; 
        var operation = params.operation; // 'ADD', 'DELETE', 'UPDATE'
        var value = params.value;         // Giá trị mới (hoặc giá trị để xóa)
        var oldValue = params.oldValue;   // Giá trị cũ (dùng để tìm dòng khi UPDATE)
        var code = params.code || ""; 
        var extra = params.extra || ""; 

        if (!category || !operation || !value) {
            return responseJSON({ success: false, message: "Missing required params" });
        }

        var ss = SpreadsheetApp.openById(ID_SHEET_DANHMUC);
        var sheetName = "";
        var numCols = 1;

        // Map category key to Sheet Name
        switch (category) {
            case 'loaiNhap': sheetName = "LOAINHAP"; numCols = 2; break;
            case 'kienGiay': sheetName = "KIENGIAY"; numCols = 2; break;
            case 'loaiGiay': sheetName = "GIAY"; numCols = 2; break;
            case 'ncc': sheetName = "NCC2"; numCols = 3; break; 
            case 'nsx': sheetName = "NSX"; numCols = 1; break;
            default: return responseJSON({ success: false, message: "Invalid category" });
        }

        var sheet = ss.getSheetByName(sheetName);
        if (!sheet) return responseJSON({ success: false, message: "Sheet not found: " + sheetName });

        if (operation === 'ADD') {
            if (numCols === 3) {
                 sheet.appendRow([value, code, extra]);
            } else if (numCols === 2) {
                sheet.appendRow([value, code]);
            } else {
                sheet.appendRow([value]);
            }
        } else if (operation === 'DELETE') {
            var lastRow = sheet.getLastRow();
            if (lastRow >= 2) {
                var data = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
                var rowToDelete = -1;
                for (var i = 0; i < data.length; i++) {
                    if (String(data[i][0]) === String(value)) {
                        rowToDelete = i + 2; 
                        break;
                    }
                }
                if (rowToDelete !== -1) {
                    sheet.deleteRow(rowToDelete);
                } else {
                    return responseJSON({ success: false, message: "Item not found" });
                }
            }
        } else if (operation === 'UPDATE') {
             // Tìm dòng có cột 1 bằng oldValue
             var targetValue = oldValue || value; // Fallback
             var lastRow = sheet.getLastRow();
             if (lastRow >= 2) {
                var data = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
                var rowToUpdate = -1;
                for (var i = 0; i < data.length; i++) {
                    if (String(data[i][0]) === String(targetValue)) {
                        rowToUpdate = i + 2;
                        break;
                    }
                }
                
                if (rowToUpdate !== -1) {
                    // Cập nhật dữ liệu
                    if (numCols === 3) {
                        sheet.getRange(rowToUpdate, 1, 1, 3).setValues([[value, code, extra]]);
                    } else if (numCols === 2) {
                        sheet.getRange(rowToUpdate, 1, 1, 2).setValues([[value, code]]);
                    } else {
                        sheet.getRange(rowToUpdate, 1, 1, 1).setValues([[value]]);
                    }
                } else {
                    return responseJSON({ success: false, message: "Item not found to update" });
                }
             }
        }

        return responseJSON({ success: true });

    } catch (e) {
        return responseJSON({ success: false, message: e.message });
    } finally {
        lock.releaseLock();
    }
}

function handleBatch(params) {
  var commands = params.commands;
  if (!commands || !Array.isArray(commands)) {
    return responseJSON({ success: false, message: "Invalid batch data" });
  }

  var results = [];
  var ssKho = SpreadsheetApp.openById(ID_SHEET_KHO);
  var sheetKho = ssKho.getSheetByName("KHO");

  commands.forEach(function(cmd) {
    try {
      if (cmd.type === 'IMPORT') {
         var item = cmd.payload;
         if (!item || !item.sku) {
             results.push({ id: cmd.id, success: false, message: "Missing SKU in payload" });
             return;
         }
         var rowData = convertItemToRow(item);
         sheetKho.appendRow(rowData);
         
         try {
             logImportHistory([item]);
         } catch (e) { console.error("History Log Error (Single): " + e.message); }

         results.push({ id: cmd.id, success: true });

      } else if (cmd.type === 'IMPORT_BATCH') {
         var items = cmd.payload;
         if (!items || !Array.isArray(items) || items.length === 0) {
            results.push({ id: cmd.id, success: false, message: "Invalid batch payload" });
            return;
         }
         var rowsToAdd = items.map(convertItemToRow);
         if (rowsToAdd.length > 0) {
            var lastRow = sheetKho.getLastRow();
            sheetKho.getRange(lastRow + 1, 1, rowsToAdd.length, 19).setValues(rowsToAdd);
         }

         try {
             logImportHistory(items);
         } catch (e) { console.error("History Log Error (Batch): " + e.message); }

         results.push({ id: cmd.id, success: true });

      } else if (cmd.type === 'UPDATE') {
         var item = cmd.payload;
         if (!item || !item.sku) {
             results.push({ id: cmd.id, success: false, message: "Missing SKU" });
             return;
         }
         var textFinder = sheetKho.getRange("A:A").createTextFinder(item.sku).matchEntireCell(true);
         var foundRange = textFinder.findNext();
         if (foundRange) {
             var row = foundRange.getRow();
             var rowData = convertItemToRow(item);
             sheetKho.getRange(row, 1, 1, 19).setValues([rowData]);
             results.push({ id: cmd.id, success: true });
         } else {
             results.push({ id: cmd.id, success: false, message: "SKU not found: " + item.sku });
         }

      } else {
         results.push({ id: cmd.id, success: true, message: "No-op or Unsupported in this version" });
      }
    } catch (err) {
      results.push({ id: cmd.id, success: false, error: err.message });
    }
  });

  SpreadsheetApp.flush();
  return responseJSON({ success: true, results: results });
}

function logImportHistory(items) {
    if (!items || items.length === 0) return;
    
    var year = new Date().getFullYear();
    var sheetName = "NHAP_" + year;
    
    var ssHistory = SpreadsheetApp.openById(ID_SHEET_NHAP);
    var sheetHist = ssHistory.getSheetByName(sheetName);
    
    if (!sheetHist) {
        sheetHist = ssHistory.insertSheet(sheetName);
    }
    
    var historyRows = items.map(function(item) {
        var rowArr = convertItemToRow(item);
        var rowStr = rowArr.map(function(v) { 
             return (v === null || v === undefined) ? "" : String(v); 
        }).join('|');
        return [rowStr];
    });
    
    if (historyRows.length > 0) {
        sheetHist.getRange(sheetHist.getLastRow() + 1, 1, historyRows.length, 1).setValues(historyRows);
    }
}

function convertItemToRow(item) {
    return [
        item.sku,                       
        item.purpose || "",             
        item.packetCode || "",          
        item.paperType || "",           
        item.gsm || "",                 
        item.supplier || "",            
        item.manufacturer || "",        
        item.importDate || "",          
        item.productionDate || "",      
        Number(item.length) || 0,       
        Number(item.width) || 0,        
        Number(item.weight) || 0,       
        Number(item.quantity) || 0,     
        item.orderCustomer || "",       
        item.materialCode || "",        
        item.location || "",            
        item.pendingOut || "",          
        item.importer || "",            
        item.lastUpdated || ""          
    ];
}

function handleLogin(params) {
  var username = params.username;
  var password = params.password;
  
  if (!username || !password) return responseJSON({ success: false, message: "Thiếu thông tin" });

  var ss = SpreadsheetApp.openById(ID_SHEET_DANG_NHAP);
  var sheet = ss.getSheetByName("DN"); // Assuming the sheet name is still "DN" or default
  if (!sheet) sheet = ss.getSheets()[0]; // Fallback to first sheet if DN not found

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return responseJSON({ success: false, message: "Lỗi hệ thống hoặc chưa có dữ liệu user" });
  
  var data = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  for (var i = 0; i < data.length; i++) {
    // Basic auth check
    if (String(data[i][0]) == username && String(data[i][1]) == password) {
      return responseJSON({ success: true, user: { username: username } });
    }
  }
  return responseJSON({ success: false, message: "Sai tài khoản/mật khẩu" });
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

function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
