import React, { useState, useEffect } from 'react';
import { ViewMode, Product, Customer, Supplier, Order, ActivityLog, CartItem, PaymentMethod, PurchaseOrder } from './types';
import { 
  INITIAL_CUSTOMERS, 
  INITIAL_ACTIVITY_LOGS,
  INITIAL_PURCHASES 
} from './data/mockData';
import {
  subscribeProducts,
  addProduct,
  updateProduct
} from './lib/productsService';
import {
  subscribeOrders,
  addOrder,
  updateOrder
} from './lib/ordersService';
import {
  subscribeSuppliers,
  addSupplier,
  updateSupplier,
  deleteSupplier
} from './lib/suppliersService';
import {
  subscribeCustomers,
  addCustomer,
  updateCustomer,
  deleteCustomer
} from './lib/customersService';
import {
  subscribePurchases,
  addPurchase
} from './lib/purchasesService';
import { getDashboardStats } from './utils/dashboardUtils';

import { Header } from './components/Header';
import { DashboardView } from './components/Dashboard/DashboardView';
import { PosView } from './components/POS/PosView';
import { GoodsModal } from './components/Modals/GoodsModal';
import { OrdersModal } from './components/Modals/OrdersModal';
import { CustomersModal } from './components/Modals/CustomersModal';
import { CashbookModal } from './components/Modals/CashbookModal';
import { InvoiceReceiptModal } from './components/Modals/InvoiceReceiptModal';
import { QrPaymentModal } from './components/Modals/QrPaymentModal';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');

  // Application Persistent State
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState<boolean>(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(true);
  const [purchases, setPurchases] = useState<PurchaseOrder[]>(INITIAL_PURCHASES);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(INITIAL_ACTIVITY_LOGS);

  // Subscribe to Firebase Firestore for products real-time data
  useEffect(() => {
    const unsubscribe = subscribeProducts(
      (firebaseProducts) => {
        const unique = Array.from(new Map(firebaseProducts.map((p) => [p.id, p])).values());
        setProducts(unique);
        setLoadingProducts(false);
      },
      (error) => {
        console.error('Firebase error:', error);
        setLoadingProducts(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Subscribe to Firebase Firestore for customers real-time data
  useEffect(() => {
    const unsubscribe = subscribeCustomers(
      (firebaseCustomers) => {
        const unique = Array.from(new Map(firebaseCustomers.map((c) => [c.id, c])).values());
        setCustomers(unique);
      },
      (error) => {
        console.error('Firebase customers error:', error);
      }
    );
    return () => unsubscribe();
  }, []);

  // Subscribe to Firebase Firestore for suppliers real-time data
  useEffect(() => {
    const unsubscribe = subscribeSuppliers(
      (firebaseSuppliers) => {
        const unique = Array.from(new Map(firebaseSuppliers.map((s) => [s.id, s])).values());
        setSuppliers(unique);
        setLoadingSuppliers(false);
      },
      (error) => {
        console.error('Firebase suppliers error:', error);
        setLoadingSuppliers(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Subscribe to Firebase Firestore for orders real-time data
  useEffect(() => {
    const unsubscribe = subscribeOrders(
      (firebaseOrders) => {
        const unique = Array.from(new Map(firebaseOrders.map((o) => [o.id, o])).values());
        setOrders(unique);
        setLoadingOrders(false);
      },
      (error) => {
        console.error('Firebase orders error:', error);
        setLoadingOrders(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Subscribe to Firebase Firestore for purchases real-time data
  useEffect(() => {
    const unsubscribe = subscribePurchases(
      (firebasePurchases) => {
        const unique = Array.from(new Map(firebasePurchases.map((p) => [p.id, p])).values());
        setPurchases(unique);
      },
      (error) => {
        console.error('Firebase purchases error:', error);
      }
    );
    return () => unsubscribe();
  }, []);

  // Daily totals calculated dynamically from database orders
  const { todayRevenue, todayOrdersCount } = getDashboardStats(orders, products);

  // Modals state
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState<{
    orderCode: string;
    date: string;
    customerName: string;
    cart: CartItem[];
    discount: number;
    surcharge: number;
    amountPaid: number;
    paymentMethod: PaymentMethod;
    totalAmount: number;
    note?: string;
  } | null>(null);

  // Handlers
  const handleAddNewProduct = async (newProduct: Product) => {
    try {
      await addProduct(newProduct);
    } catch (err) {
      console.error('Failed to add product to Firestore:', err);
    }
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    try {
      await updateProduct(updatedProduct.id, updatedProduct);
    } catch (err) {
      console.error('Failed to update product in Firestore:', err);
    }
  };

  const handleAddNewCustomer = async (newCust: Customer) => {
    try {
      const { id, ...custData } = newCust;
      const created = await addCustomer(custData);
      setCustomers((prev) => [created, ...prev.filter((c) => c.id !== id)]);
    } catch (err) {
      console.error('Failed to add customer to Firestore:', err);
      setCustomers((prev) => [newCust, ...prev]);
    }
  };

  const handleUpdateCustomer = async (id: string, updates: Partial<Customer>) => {
    try {
      await updateCustomer(id, updates);
      setCustomers((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
      );
    } catch (err) {
      console.error('Failed to update customer in Firestore:', err);
      setCustomers((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
      );
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    try {
      await deleteCustomer(id);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error('Failed to delete customer in Firestore:', err);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const handleAddNewSupplier = async (newSupp: Omit<Supplier, 'id'>) => {
    try {
      await addSupplier(newSupp);
    } catch (err) {
      console.error('Failed to add supplier to Firestore:', err);
    }
  };

  const handleUpdateSupplier = async (id: string, updates: Partial<Supplier>) => {
    try {
      await updateSupplier(id, updates);
    } catch (err) {
      console.error('Failed to update supplier in Firestore:', err);
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    try {
      await deleteSupplier(id);
    } catch (err) {
      console.error('Failed to delete supplier from Firestore:', err);
    }
  };

  const handleAddNewPurchase = async (newPurchase: PurchaseOrder) => {
    try {
      await addPurchase(newPurchase);
    } catch (err) {
      console.error('Failed to add purchase order to Firestore:', err);
      setPurchases((prev) => [newPurchase, ...prev]);
    }
  };

  // Complete Order Checkout Handler
  const handleCompleteCheckout = async (checkoutData: {
    customerCode?: string;
    customerName: string;
    cart: CartItem[];
    subtotal: number;
    discount: number;
    surcharge: number;
    amountPaid: number;
    paymentMethod: PaymentMethod;
    totalAmount: number;
    note: string;
  }) => {
    const now = new Date();
    const dateFormatted = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    const nextSeq = 9722 + orders.length;
    const orderCode = `HD${String(nextSeq).padStart(6, '0')}`;

    const newOrderData: Omit<Order, 'id'> = {
      orderCode,
      date: dateFormatted,
      returnCode: '',
      customerCode: checkoutData.customerCode || 'KH000009',
      customerName: checkoutData.customerName || 'Khách lẻ',
      subtotal: checkoutData.subtotal || checkoutData.totalAmount,
      discount: checkoutData.discount || 0,
      totalAmount: checkoutData.totalAmount,
      amountPaid: checkoutData.amountPaid,
      itemsCount: checkoutData.cart.reduce((sum, item) => sum + item.quantity, 0),
      paymentMethod: checkoutData.paymentMethod,
      status: 'Đã thanh toán',
      items: checkoutData.cart,
      note: checkoutData.note,
    };

    try {
      // 1. Save invoice/order to Firestore
      await addOrder(newOrderData);

      // 2. Decrement stock for purchased products in Firestore
      for (const item of checkoutData.cart) {
        const prod = products.find((p) => p.id === item.product.id || p.code === item.product.code);
        if (prod) {
          const newStock = Math.max(0, prod.stock - item.quantity);
          await updateProduct(prod.id, { stock: newStock });
        }
      }

      // 3. Automatically update customer debt & stats in Firestore database
      const unpaidDebt = Math.max(0, checkoutData.totalAmount - checkoutData.amountPaid);
      const targetCustomer = customers.find(
        (c) =>
          (checkoutData.customerCode && c.code === checkoutData.customerCode) ||
          c.name.toLowerCase() === checkoutData.customerName.toLowerCase() ||
          (c.id === checkoutData.customerCode)
      );

      if (targetCustomer) {
        const updatedDebt = (targetCustomer.debt || 0) + unpaidDebt;
        const updatedTotalSpent = (targetCustomer.totalSpent || 0) + checkoutData.totalAmount;
        const updatedOrderCount = (targetCustomer.orderCount || 0) + 1;
        const updatedPoints = (targetCustomer.points || 0) + Math.floor(checkoutData.totalAmount / 100000);

        await updateCustomer(targetCustomer.id, {
          debt: updatedDebt,
          totalSpent: updatedTotalSpent,
          orderCount: updatedOrderCount,
          points: updatedPoints,
        });

        // Update local customer state immediately
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === targetCustomer.id
              ? {
                  ...c,
                  debt: updatedDebt,
                  totalSpent: updatedTotalSpent,
                  orderCount: updatedOrderCount,
                  points: updatedPoints,
                }
              : c
          )
        );
      } else if (checkoutData.customerName && checkoutData.customerName !== 'Khách lẻ') {
        // Create new customer record in Firestore if not existing
        const newCustData: Omit<Customer, 'id'> = {
          code: checkoutData.customerCode || `KH${Date.now().toString().slice(-6)}`,
          name: checkoutData.customerName,
          phone: '',
          address: '',
          totalSpent: checkoutData.totalAmount,
          orderCount: 1,
          debt: unpaidDebt,
          points: Math.floor(checkoutData.totalAmount / 100000),
        };
        const createdCust = await addCustomer(newCustData);
        setCustomers((prev) => [createdCust, ...prev]);
      }

      // Add activity log
      const newLog: ActivityLog = {
        id: `log-${Date.now()}`,
        time: 'vừa xong',
        type: 'sale',
        storeName: 'Chống Thấm 36',
        actionText: 'vừa bán đơn hàng',
        amount: checkoutData.totalAmount,
        formattedAmount: checkoutData.totalAmount.toLocaleString('vi-VN'),
      };
      setActivityLogs([newLog, ...activityLogs]);

      // Open Receipt Printable Modal
      setSelectedOrderForReceipt({
        orderCode,
        date: dateFormatted,
        customerName: checkoutData.customerName,
        cart: checkoutData.cart,
        discount: checkoutData.discount,
        surcharge: checkoutData.surcharge,
        amountPaid: checkoutData.amountPaid,
        paymentMethod: checkoutData.paymentMethod,
        totalAmount: checkoutData.totalAmount,
        note: checkoutData.note,
      });
    } catch (error) {
      console.error('Failed to complete order in Firestore:', error);
      alert('Đã xảy ra lỗi khi lưu hóa đơn vào cơ sở dữ liệu.');
    }
  };

  // Reprint previous order
  const handleReprintOrder = (ord: Order) => {
    setSelectedOrderForReceipt({
      orderCode: ord.orderCode,
      date: ord.date,
      customerName: ord.customerName,
      cart: ord.items,
      discount: 0,
      surcharge: 0,
      amountPaid: ord.totalAmount,
      paymentMethod: ord.paymentMethod,
      totalAmount: ord.totalAmount,
      note: ord.note,
    });
  };

  // Handle direct navigation/link to invoice from activity log
  const handleSelectOrderFromActivity = (orderCode: string) => {
    const foundOrder = orders.find(
      (o) => o.orderCode.toLowerCase() === orderCode.toLowerCase() || o.id === orderCode
    );
    if (foundOrder) {
      handleReprintOrder(foundOrder);
    } else {
      setCurrentView('orders');
    }
  };

  // Update order (note, status, etc.) in Firestore
  const handleUpdateOrder = async (id: string, updates: Partial<Order>) => {
    try {
      await updateOrder(id, updates);
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, ...updates } : o))
      );
    } catch (err) {
      console.error('Failed to update order in Firestore:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f3f4f6] text-gray-800 font-sans antialiased">
      {/* If currentView === 'pos', render dedicated Fullscreen Cashier Screen */}
      {currentView === 'pos' ? (
        <PosView
          products={products}
          customers={customers}
          onBackToDashboard={() => setCurrentView('dashboard')}
          onCompleteCheckout={handleCompleteCheckout}
          onAddNewCustomer={handleAddNewCustomer}
        />
      ) : (
        /* Standard Management Navigation Layout */
        <div className="flex-1 flex flex-col min-h-screen">
          <Header
            currentView={currentView}
            onSelectView={(v) => setCurrentView(v)}
            onOpenPos={() => setCurrentView('pos')}
            unreadNotifications={2}
          />

          {/* Main View Router */}
          {currentView === 'dashboard' && (
            <DashboardView
              orders={orders}
              products={products}
              activityLogs={activityLogs}
              todayRevenue={todayRevenue}
              todayOrdersCount={todayOrdersCount}
              onOpenQrInfo={() => setShowQrModal(true)}
              onSelectOrder={handleSelectOrderFromActivity}
            />
          )}

          {(currentView === 'goods' || currentView === 'stock-check') && (
            <GoodsModal
              products={products}
              orders={orders}
              purchases={purchases}
              onAddProduct={handleAddNewProduct}
              onUpdateProduct={handleUpdateProduct}
            />
          )}

          {(currentView === 'orders' || currentView === 'returns' || currentView === 'purchases' || currentView === 'purchase-returns') && (
            <OrdersModal
              orders={orders}
              purchases={purchases}
              products={products}
              suppliers={suppliers}
              currentView={currentView}
              onSelectView={(v) => setCurrentView(v)}
              onReprintOrder={handleReprintOrder}
              onUpdateOrder={handleUpdateOrder}
              onAddPurchase={handleAddNewPurchase}
              onAddProduct={handleAddNewProduct}
              onUpdateProduct={handleUpdateProduct}
              onAddSupplier={handleAddNewSupplier}
              onUpdateSupplier={handleUpdateSupplier}
            />
          )}

          {(currentView === 'customers' || currentView === 'suppliers' || currentView === 'employees' || currentView === 'promotions') && (
            <CustomersModal
              customers={customers}
              suppliers={suppliers}
              orders={orders}
              currentView={currentView}
              onSelectView={(v) => setCurrentView(v)}
              onAddCustomer={handleAddNewCustomer}
              onUpdateCustomer={handleUpdateCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              onAddSupplier={handleAddNewSupplier}
              onUpdateSupplier={handleUpdateSupplier}
              onDeleteSupplier={handleDeleteSupplier}
            />
          )}

          {(currentView === 'cashbook' || currentView === 'reports' || currentView === 'online' || currentView === 'tax') && (
            <CashbookModal todayRevenue={todayRevenue} />
          )}
        </div>
      )}

      {/* QR Code Ting Ting Modal */}
      {showQrModal && (
        <QrPaymentModal onClose={() => setShowQrModal(false)} />
      )}

      {/* Invoice Printable Receipt Modal */}
      {selectedOrderForReceipt && (
        <InvoiceReceiptModal
          orderCode={selectedOrderForReceipt.orderCode}
          date={selectedOrderForReceipt.date}
          customerName={selectedOrderForReceipt.customerName}
          cart={selectedOrderForReceipt.cart}
          discount={selectedOrderForReceipt.discount}
          surcharge={selectedOrderForReceipt.surcharge}
          amountPaid={selectedOrderForReceipt.amountPaid}
          paymentMethod={selectedOrderForReceipt.paymentMethod}
          totalAmount={selectedOrderForReceipt.totalAmount}
          note={selectedOrderForReceipt.note}
          onClose={() => setSelectedOrderForReceipt(null)}
        />
      )}
    </div>
  );
}
