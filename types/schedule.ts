export interface ScheduleItem {
  id: string;
  purchaseOrder: string;     // 1. Đơn hàng
  materialType: string;      // 2. Loại vật tư
  supplierCode: string;      // 3. Mã NCC
  supplierName: string;      // 4. Tên NCC
  materialCode: string;      // 5. Mã vật tư
  materialName: string;      // 6. Tên vật tư
  orderCustomer: string;     // 7. Khách hàng
  packetType: string;        // 8. Loại kiện
  paperType: string;         // 9. Loại giấy
  manufacturer: string;      // 10. Nhà sản xuất
  purchaseDate: string;      // 11. Ngày mua
  gsm: number;               // 12. Định lượng
  rollWidth: number;         // 13. Khổ
  length: number;            // 14. Dài
  width: number;             // 15. Rộng
  quantity: number;          // 16. Số lượng
  unit: string;              // 17. Đơn vị
  expectedArrivalDate: string; // 18. Ngày về dự kiến
  importer: string;          // 19. Người nhập
  updatedAt: string;         // 20. Ngày cập nhật
}
