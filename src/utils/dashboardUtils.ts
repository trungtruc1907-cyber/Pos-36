import { Order, Product, ActivityLog } from '../types';

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

  const vsYesterdayPercent = yesterdayRevenue > 0
    ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 10000) / 100
    : (todayRevenue > 0 ? 100 : 0);

  const vsLastMonthPercent = lastMonthRevenue > 0
    ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 10000) / 100
    : (thisMonthRevenue > 0 ? 100 : 0);

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

  // If no order items exist yet, supplement from products DB
  if (Object.keys(productStats).length === 0 && products.length > 0) {
    products.slice(0, 10).forEach((p) => {
      productStats[p.name] = {
        revenue: (p.price || 200000) * (p.stock || 5),
        quantity: p.stock || 5,
      };
    });
  }

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
  return orders.slice(0, 10).map((ord) => ({
    id: ord.id,
    type: 'sale' as const,
    storeName: 'Chống Thấm 36',
    actionText: `vừa bán đơn hàng ${ord.orderCode}`,
    amount: ord.totalAmount,
    formattedAmount: `${ord.totalAmount.toLocaleString('vi-VN')}đ`,
    time: ord.date,
  }));
}
