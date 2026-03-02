'use client';

import React, { useState, useEffect } from 'react';

interface Store {
  id: number;
  name: string;
  address: string;
  city: string;
  state?: string;
  phone?: string;
  email?: string;
  hours?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
}

export default function StorePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async (city?: string) => {
    try {
      setLoading(true);
      const url = city
        ? `/api/stores?city=${encodeURIComponent(city)}`
        : '/api/stores';

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setStores(data.data);
      } else {
        setError('Không thể tải danh sách cửa hàng');
      }
    } catch (err) {
      setError('Đã xảy ra lỗi khi tải dữ liệu');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      fetchStores(searchQuery);
    } else {
      fetchStores();
    }
  };

  const filteredStores = stores.filter(store =>
    store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="toan-container py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Tìm Cửa Hàng</h1>
          <p className="text-gray-600 mb-8">
            Tìm cửa hàng TOAN Store gần nhất để trải nghiệm sản phẩm trực tiếp
          </p>

          <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên cửa hàng, địa chỉ hoặc thành phố..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
              >
                Tìm Kiếm
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Đang tải danh sách cửa hàng...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500">{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredStores.length > 0 ? (
                filteredStores.map((store) => (
                  <div key={store.id} className="bg-white rounded-lg p-6 shadow-sm">
                    <h3 className="text-xl font-helvetica-medium mb-3">{store.name}</h3>
                    <div className="space-y-2 text-gray-700 mb-4">
                      <div className="flex items-start">
                        <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p>{store.address}, {store.city}</p>
                      </div>
                      {store.phone && (
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <a href={`tel:${store.phone}`} className="text-black hover:underline">
                            {store.phone}
                          </a>
                        </div>
                      )}
                      {store.hours && (
                        <div className="flex items-start">
                          <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="text-sm">
                            <p className="font-medium mb-1">Giờ mở cửa:</p>
                            <p className="text-gray-600 whitespace-pre-line">{store.hours.replace(/ \| /g, '\n')}</p>
                          </div>
                        </div>
                      )}
                      {store.description && (
                        <p className="text-sm text-gray-600 mt-2">{store.description}</p>
                      )}
                    </div>
                    {store.latitude && store.longitude && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${store.latitude},${store.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full mt-4 px-4 py-2 border border-black rounded-lg hover:bg-black hover:text-white transition inline-block text-center"
                      >
                        Xem Bản Đồ
                      </a>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-12">
                  <p className="text-gray-500">Không tìm thấy cửa hàng nào.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

