import { Order, Product, Customer, Supplier, PurchaseOrder, ActivityLog } from '../types';
import { parseDateToMillis } from './dateUtils';

export function parseOrderDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.trim().split(' ');
  const dateParts = parts[0].split('/');
  if (dateParts.length === 3) {
    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1; // 0-indexed
    const year = parseInt(dateParts[2], 10);
    
    let hours = 0, minutes = 0, seconds = 0;
    if (parts[1]) {
      const timeParts = parts[1].split(':');
      hours = parseInt(timeParts[0] || '0', 10);
      minutes = parseInt(timeParts[1] || '0', 10);
      seconds = parseInt(timeParts[2] || '0', 10);
    }
    return new Date(year, month, day, hours, minutes, seconds);
  }
  
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

export function getRefDate(orders: Order[]): Date {
  // Find the newest order date or fallback to current Date
  let newest: Date | null = null;
  for (const ord of orders) {
    const d = parseOrderDate(ord.date);
    if (d && (!newest || d.getTime() > newest.getTime())) {
      newest = d;
    }
  }
  return newest || new Date();
}

export function getDashboardStats(orders: Order[], products: Product[] = []) {
  const refDate = getRefDate(orders);
  const refDay = refDate.getDate();
  const refMonth = refDate.getMonth();
  const refYear = refDate.getFullYear();

  // Yesterday date
  const yestDate = new Date(refDate);
  yestDate.setDate(refDate.getDate() - 1);
  const yestDay = yestDate.getDate();
  const yestMonth = yestDate.getMonth();
  const yestYear = yestDate.getFullYear();

  let todayRevenue = 0;
  let todayOrdersCount = 0;
  let todayReturns = 0;

  let yesterdayRevenue = 0;

  let thisMonthRevenue = 0;
  let lastMonthRevenue = 0;

  // Filter orders
  orders.forEach((ord) => {
    const d = parseOrderDate(ord.date);
    if (!d) return;

    const isReturned = ord.status === 'Trả hàng' || Boolean(ord.returnCode);

    // Check Today
    if (d.getDate() === refDay && d.getMonth() === refMonth && d.getFullYear() === refYear) {
      if (isReturned) {
        todayReturns += ord.totalAmount;
      } else {
        todayRevenue += ord.totalAmount;
        todayOrdersCount += 1;
      }
    }

    // Check Yesterday
    if (d.getDate() === yestDay && d.getMonth() === yestMonth && d.getFullYear() === yestYear) {
      if (!isReturned) {
        yesterdayRevenue += ord.totalAmount;
      }
    }

    // Check This Month
    if (d.getMonth() === refMonth && d.getFullYear() === refYear) {
      if (!isReturned) {
        thisMonthRevenue += ord.totalAmount;
      }
    }

    // Check Last Month
    const lastMonthVal = refMonth === 0 ? 11 : refMonth - 1;
    const lastMonthYearVal = refMonth === 0 ? refYear - 1 : refYear;
    if (d.getMonth() === lastMonthVal && d.getFullYear() === lastMonthYearVal) {
      if (!isReturned) {
        lastMonthRevenue += ord.totalAmount;
      }
    }
  });

  const rawVsYesterday = yesterdayRevenue > 0
    ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 10000) / 100
    : (todayRevenue > 0 ? 100 : 0);

  const rawVsLastMonth = lastMonthRevenue > 0
    ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 10000) / 100
    : (thisMonthRevenue > 0 ? 100 : 0);

  const vsYesterdayPercent = isNaN(rawVsYesterday) || !isFinite(rawVsYesterday) ? 0 : rawVsYesterday;
  const vsLastMonthPercent = isNaN(rawVsLastMonth) || !isFinite(rawVsLastMonth) ? 0 : rawVsLastMonth;

  return {
    todayRevenue,
    todayOrdersCount,
    todayReturns,
    vsYesterdayPercent,
    vsLastMonthPercent,
    thisMonthRevenue,
  };
}

export function filterOrdersByPeriod(orders: Order[], period: string, refDate: Date): Order[] {
  const refDay = refDate.getDate();
  const refMonth = refDate.getMonth();
  const refYear = refDate.getFullYear();

  return orders.filter((ord) => {
    const d = parseOrderDate(ord.date);
    if (!d) return false;

    if (period === 'Hôm nay') {
      return d.getDate() === refDay && d.getMonth() === refMonth && d.getFullYear() === refYear;
    }

    if (period === 'Tháng trước') {
      const lastMonthVal = refMonth === 0 ? 11 : refMonth - 1;
      const lastMonthYearVal = refMonth === 0 ? refYear - 1 : refYear;
      return d.getMonth() === lastMonthVal && d.getFullYear() === lastMonthYearVal;
    }

    if (period === 'Năm nay') {
      return d.getFullYear() === refYear;
    }

    // Default: 'Tháng này'
    return d.getMonth() === refMonth && d.getFullYear() === refYear;
  });
}

export function getRevenueChartData(orders: Order[], period: string, tab: 'day' | 'hour' | 'weekday') {
  const refDate = getRefDate(orders);
  const filtered = filterOrdersByPeriod(orders, period, refDate);

  if (tab === 'hour') {
    const hourSlots = ['08h', '10h', '12h', '14h', '16h', '18h', '20h'];
    const hourData = [0, 0, 0, 0, 0, 0, 0];

    filtered.forEach((ord) => {
      const d = parseOrderDate(ord.date);
      if (!d) return;
      const hour = d.getHours();
      let slotIdx = 0;
      if (hour < 9) slotIdx = 0;
      else if (hour < 11) slotIdx = 1;
      else if (hour < 13) slotIdx = 2;
      else if (hour < 15) slotIdx = 3;
      else if (hour < 17) slotIdx = 4;
      else if (hour < 19) slotIdx = 5;
      else slotIdx = 6;

      hourData[slotIdx] += ord.totalAmount;
    });

    return {
      labels: hourSlots,
      data: hourData.map((val) => Math.round((val / 1000000) * 10) / 10),
      totalNet: filtered.reduce((sum, o) => sum + o.totalAmount, 0),
    };
  }

  if (tab === 'weekday') {
    const weekdays = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
    const weekdayData = [0, 0, 0, 0, 0, 0, 0];

    filtered.forEach((ord) => {
      const d = parseOrderDate(ord.date);
      if (!d) return;
      // getDay: 0 = Sun, 1 = Mon...
      const dayIdx = d.getDay() === 0 ? 6 : d.getDay() - 1;
      weekdayData[dayIdx] += ord.totalAmount;
    });

    return {
      labels: weekdays,
      data: weekdayData.map((val) => Math.round((val / 1000000) * 10) / 10),
      totalNet: filtered.reduce((sum, o) => sum + o.totalAmount, 0),
    };
  }

  // Default: 'day'
  // Group by day of month
  const dayMap: { [day: string]: number } = {};
  filtered.forEach((ord) => {
    const d = parseOrderDate(ord.date);
    if (!d) return;
    const dayKey = String(d.getDate()).padStart(2, '0');
    dayMap[dayKey] = (dayMap[dayKey] || 0) + ord.totalAmount;
  });

  const sortedDays = Object.keys(dayMap).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  
  // If no orders or few days, build last 7-10 days
  const labels = sortedDays.length > 0 ? sortedDays : ['01', '02', '03', '04', '05', '06', '07'];
  const data = labels.map((dayKey) => Math.round(((dayMap[dayKey] || 0) / 1000000) * 10) / 10);

  return {
    labels,
    data,
    totalNet: filtered.reduce((sum, o) => sum + o.totalAmount, 0),
  };
}

export function getTopProductsData(
  orders: Order[],
  products: Product[],
  period: string,
  sortBy: 'Theo doanh thu thuần' | 'Theo số lượng' | string
) {
  const refDate = getRefDate(orders);
  const filtered = filterOrdersByPeriod(orders, period, refDate);

  const productStats: { [name: string]: { revenue: number; quantity: number } } = {};

  filtered.forEach((ord) => {
    if (ord.items && ord.items.length > 0) {
      ord.items.forEach((item) => {
        const pName = item.product?.name || 'Sản phẩm khác';
        if (!productStats[pName]) {
          productStats[pName] = { revenue: 0, quantity: 0 };
        }
        productStats[pName].revenue += item.quantity * item.unitPrice;
        productStats[pName].quantity += item.quantity;
      });
    } else {
      // Fallback if legacy order without item array
      const pName = 'Sản phẩm ' + ord.orderCode;
      if (!productStats[pName]) {
        productStats[pName] = { revenue: 0, quantity: 0 };
      }
      productStats[pName].revenue += ord.totalAmount;
      productStats[pName].quantity += ord.itemsCount || 1;
    }
  });

  // Aggregate strictly from sales invoices in database
  const entries = Object.entries(productStats).map(([name, stat]) => ({
    name,
    revenueInMillions: Math.round((stat.revenue / 1000000) * 10) / 10,
    quantity: stat.quantity,
  }));

  if (sortBy === 'Theo số lượng') {
    entries.sort((a, b) => b.quantity - a.quantity);
  } else {
    entries.sort((a, b) => b.revenueInMillions - a.revenueInMillions);
  }

  const top10 = entries.slice(0, 10);
  return {
    labels: top10.map((item) => item.name),
    values: top10.map((item) => (sortBy === 'Theo số lượng' ? item.quantity : item.revenueInMillions)),
  };
}

export function getTopCustomersData(orders: Order[], period: string) {
  const refDate = getRefDate(orders);
  const filtered = filterOrdersByPeriod(orders, period, refDate);

  const customerStats: { [name: string]: number } = {};

  filtered.forEach((ord) => {
    const cName = ord.customerName || 'Khách lẻ';
    customerStats[cName] = (customerStats[cName] || 0) + ord.totalAmount;
  });

  const entries = Object.entries(customerStats)
    .map(([name, total]) => ({
      name,
      valueInMillions: Math.round((total / 1000000) * 10) / 10,
    }))
    .sort((a, b) => b.valueInMillions - a.valueInMillions);

  const top10 = entries.slice(0, 10);
  return {
    labels: top10.map((item) => item.name),
    values: top10.map((item) => item.valueInMillions),
  };
}

export function getActivityLogsFromOrders(orders: Order[]): ActivityLog[] {
  return getComprehensiveActivityLogs(orders);
}

export function getComprehensiveActivityLogs(
  orders: Order[] = [],
  purchases: PurchaseOrder[] = [],
  customers: Customer[] = [],
  suppliers: Supplier[] = [],
  products: Product[] = [],
  customLogs: ActivityLog[] = []
): ActivityLog[] {
  const logs: (ActivityLog & { millis: number })[] = [];

  // 1. Process Sales Orders & Returns (Affects Inventory & Customer Debt)
  orders.forEach((ord) => {
    const millis = parseDateToMillis(ord.date, ord.createdAt);
    const isReturn = ord.status === 'Trả hàng' || Boolean(ord.returnCode);
    const itemsCount = ord.itemsCount || (ord.items ? ord.items.reduce((s, i) => s + i.quantity, 0) : 1);
    const unpaidDebt = ord.totalAmount - (ord.amountPaid || 0);

    let inventoryImpact = '';
    let customerDebtImpact = '';

    if (isReturn) {
      inventoryImpact = `+${itemsCount} SP (Nhận trả)`;
      if (ord.totalAmount > 0) {
        customerDebtImpact = `Giảm nợ KH: ${(ord.totalAmount || 0).toLocaleString('vi-VN')}đ`;
      }
    } else {
      inventoryImpact = `-${itemsCount} SP (Bán hàng)`;
      if (unpaidDebt > 0) {
        customerDebtImpact = `Tăng nợ KH: +${(unpaidDebt || 0).toLocaleString('vi-VN')}đ`;
      } else {
        customerDebtImpact = `Đã thanh toán đủ`;
      }
    }

    logs.push({
      id: `order-log-${ord.id}`,
      time: ord.date || 'Gần đây',
      type: isReturn ? 'return' : 'sale',
      storeName: 'Chống Thấm 36',
      actionText: isReturn 
        ? `Nhận trả hàng ${ord.orderCode} từ ${ord.customerName}`
        : `Bán đơn hàng ${ord.orderCode} cho ${ord.customerName}`,
      amount: ord.totalAmount,
      formattedAmount: `${(ord.totalAmount || 0).toLocaleString('vi-VN')}đ`,
      orderCode: ord.orderCode,
      orderId: ord.id,
      entityCode: ord.orderCode,
      entityType: 'order',
      inventoryImpact,
      customerDebtImpact,
      millis,
    });
  });

  // 2. Process Purchase Orders / Imports (Affects Inventory & Supplier Debt)
  purchases.forEach((p) => {
    const millis = parseDateToMillis(p.date, p.createdAt);
    const itemsCount = p.itemsCount || (p.items ? p.items.reduce((s, i) => s + i.quantity, 0) : 1);
    const unpaidDebt = p.totalAmount - (p.paidAmount || 0);

    const inventoryImpact = `+${itemsCount} SP (Nhập hàng)`;
    let supplierDebtImpact = '';

    if (unpaidDebt > 0) {
      supplierDebtImpact = `Tăng nợ NCC: +${(unpaidDebt || 0).toLocaleString('vi-VN')}đ`;
    } else {
      supplierDebtImpact = `Đã thanh toán đủ`;
    }

    logs.push({
      id: `pur-log-${p.id}`,
      time: p.date || 'Gần đây',
      type: 'import',
      storeName: 'Chống Thấm 36',
      actionText: `Nhập đơn hàng ${p.code} từ ${p.supplierName}`,
      amount: p.totalAmount,
      formattedAmount: `${(p.totalAmount || 0).toLocaleString('vi-VN')}đ`,
      orderCode: p.code,
      entityCode: p.code,
      entityType: 'purchase',
      inventoryImpact,
      supplierDebtImpact,
      millis,
    });
  });

  // 3. Process Customers with Debt
  customers.forEach((c) => {
    if (c.debt && c.debt > 0) {
      const millis = parseDateToMillis(c.createdAt);
      logs.push({
        id: `cust-log-${c.id}`,
        time: c.createdAt || 'Gần đây',
        type: 'customer_debt',
        storeName: 'Chống Thấm 36',
        actionText: `Ghi nhận công nợ khách hàng ${c.name}`,
        amount: c.debt,
        formattedAmount: `${(c.debt || 0).toLocaleString('vi-VN')}đ`,
        entityCode: c.code || 'KH',
        entityType: 'customer',
        customerDebtImpact: `Dư nợ KH: ${(c.debt || 0).toLocaleString('vi-VN')}đ`,
        millis,
      });
    }
  });

  // 4. Process Suppliers with Debt
  suppliers.forEach((s) => {
    if (s.currentDebt && s.currentDebt > 0) {
      const millis = parseDateToMillis(s.createdAt);
      logs.push({
        id: `supp-log-${s.id}`,
        time: s.createdAt || 'Gần đây',
        type: 'supplier_debt',
        storeName: 'Chống Thấm 36',
        actionText: `Ghi nhận nợ cần trả nhà cung cấp ${s.name}`,
        amount: s.currentDebt,
        formattedAmount: `${(s.currentDebt || 0).toLocaleString('vi-VN')}đ`,
        entityCode: s.code,
        entityType: 'supplier',
        supplierDebtImpact: `Nợ cần trả: ${(s.currentDebt || 0).toLocaleString('vi-VN')}đ`,
        millis,
      });
    }
  });

  // 5. Process Products Inventory Stock
  products.forEach((p) => {
    if (p.createdAt || p.updatedAt) {
      const millis = parseDateToMillis(p.updatedAt || p.createdAt);
      if (millis > 0) {
        logs.push({
          id: `prod-log-${p.id}`,
          time: p.updatedAt || p.createdAt || 'Gần đây',
          type: 'inventory',
          storeName: 'Chống Thấm 36',
          actionText: `Cập nhật tồn kho sản phẩm ${p.name}`,
          entityCode: p.code,
          entityType: 'product',
          inventoryImpact: `Tồn kho: ${p.stock} ${p.unit || 'SP'}`,
          millis,
        });
      }
    }
  });

  // 6. Include Custom session logs
  customLogs.forEach((cl) => {
    const millis = parseDateToMillis(cl.time) || Date.now();
    logs.push({
      ...cl,
      millis,
    });
  });

  // Deduplicate logs by ID
  const uniqueMap = new Map<string, ActivityLog & { millis: number }>();
  logs.forEach((log) => uniqueMap.set(log.id, log));

  // Sort descending by millis (newest first)
  const sorted = Array.from(uniqueMap.values()).sort((a, b) => b.millis - a.millis);

  return sorted.map(({ millis, ...rest }) => rest);
}
