export interface ScheduleItem {
  id: string;
  materialType: string;      // 0. Loại vật tư
  purchaseDate: string;      // 1. Ngày mua
  purchaseOrder: string;     // 2. Đơn hàng mua
  supplierCode: string;      // 3. Mã nhà cung cấp
  supplierName: string;      // 4. Tên nhà cung cấp
  materialName: string;      // 5. Tên vật tư
  orderCustomer: string;     // 6. Đơn hàng / Khách hàng
  gsm: number;               // 6.5 Định lượng
  rollWidth: number;         // 7. Khổ lô
  length: number;            // 8. Dài
  width: number;             // 9. Rộng
  quantity: number;          // 10. Số lượng
  unit: string;              // 11. Đơn vị
  expectedArrivalDate: string; // 12. Ngày dự kiến về
  
  // New fields
  packetType?: string;       // Loại Kiện
  paperType?: string;        // Loại Giấy
  manufacturer?: string;     // Nhà sản xuất
  importer?: string;         // Người nhập
  updatedAt?: string;        // Cập nhật
}
