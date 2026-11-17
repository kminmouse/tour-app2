import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { ref, set, remove, onValue } from 'firebase/database';
import { Heart, MapPin, Bookmark, Compass, ImageOff } from 'lucide-react';
import './App.css';

// 한국관광공사 지역 코드 (areaCode)
const REGIONS = [
  { code: '1', name: '서울' },
  { code: '6', name: '부산' },
  { code: '4', name: '대구' },
  { code: '2', name: '인천' },
  { code: '5', name: '광주' },
  { code: '3', name: '대전' },
  { code: '7', name: '울산' },
  { code: '31', name: '경기' },
  { code: '32', name: '강원' },
  { code: '39', name: '제주' },
];

// 공공데이터포털 일반 인증키(Decoding) 입력
const SERVICE_KEY = '본인의_공공데이터_일반인증키_DECODING';

function App() {
  const [selectedArea, setSelectedArea] = useState('1'); // 기본값: 서울
  const [tours, setTours] = useState([]); // API로 불러온 관광지 목록
  const [bookmarks, setBookmarks] = useState({}); // Firebase에 저장된 찜 목록 객체
  const [activeTab, setActiveTab] = useState('explore'); // 'explore'(탐색) | 'saved'(보관함)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Firebase Realtime Database에서 실시간으로 찜 목록 불러오기
  useEffect(() => {
    const bookmarksRef = ref(db, 'bookmarks');
    const unsubscribe = onValue(bookmarksRef, (snapshot) => {
      const data = snapshot.val();
      setBookmarks(data || {});
    });
    return () => unsubscribe();
  }, []);

  // 2. 선택된 지역이 변경될 때마다 TourAPI(지역기반 관광정보조회) 호출
  useEffect(() => {
    if (activeTab !== 'explore') return;

    const fetchTours = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = new URL('https://apis.data.go.kr/B551011/KorService1/areaBasedList1');
        url.searchParams.append('serviceKey', SERVICE_KEY);
        url.searchParams.append('numOfRows', '16');
        url.searchParams.append('pageNo', '1');
        url.searchParams.append('MobileOS', 'ETC');
        url.searchParams.append('MobileApp', 'TourApp');
        url.searchParams.append('_type', 'json');
        url.searchParams.append('arrange', 'Q'); // 이미지가 있는 데이터 우선 정렬
        url.searchParams.append('areaCode', selectedArea);

        const response = await fetch(url.toString());
        if (!response.ok) throw new Error('API 응답 오류가 발생했습니다.');
        
        const data = await response.json();
        const items = data.response?.body?.items?.item || [];
        setTours(items);
      } catch (err) {
        console.error(err);
        setError('관광 정보를 불러오는 데 실패했습니다. API 키와 네트워크 상태를 확인해주세요.');
      } finally {
        setLoading(false);
      }
    };

    fetchTours();
  }, [selectedArea, activeTab]);

  // 3. 찜하기 / 찜 취소 토글 (Firebase 저장 및 삭제)
  const toggleBookmark = async (item) => {
    const itemRef = ref(db, `bookmarks/${item.contentid}`);
    const isBookmarked = !!bookmarks[item.contentid];

    try {
      if (isBookmarked) {
        await remove(itemRef); // Firebase에서 삭제
      } else {
        await set(itemRef, {
          contentid: item.contentid,
          title: item.title,
          addr1: item.addr1 || '주소 정보 없음',
          firstimage: item.firstimage || '',
          savedAt: new Date().toISOString(),
        }); // Firebase에 저장
      }
    } catch (err) {
      alert('Firebase 저장 중 오류가 발생했습니다: ' + err.message);
    }
  };

  // 현재 탭에 따라 보여줄 목록 결정
  const displayList = activeTab === 'explore' ? tours : Object.values(bookmarks);

  return (
    <div className="app-container">
      {/* 상단 헤더 및 탭 네비게이션 */}
      <header className="header">
        <h1>🌸 대한민국 구석구석 관광 가이드</h1>
        <p>원하는 지역을 선택하고 나만의 여행지를 찜해보세요!</p>
        
        <div className="tab-buttons">
          <button
            className={`tab-btn ${activeTab === 'explore' ? 'active' : ''}`}
            onClick={() => setActiveTab('explore')}
          >
            <Compass size={18} /> 지역별 관광지 탐색
          </button>
          <button
            className={`tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
            onClick={() => setActiveTab('saved')}
          >
            <Bookmark size={18} /> 내 찜 보관함 ({Object.keys(bookmarks).length})
          </button>
        </div>
      </header>

      {/* 지역 선택 버튼 바 (탐색 탭일 때만 표시) */}
      {activeTab === 'explore' && (
        <section className="region-selector">
          {REGIONS.map((region) => (
            <button
              key={region.code}
              className={`region-btn ${selectedArea === region.code ? 'active' : ''}`}
              onClick={() => setSelectedArea(region.code)}
            >
              {region.name}
            </button>
          ))}
        </section>
      )}

      {/* 상태 안내 및 시각화된 카드 목록 뷰 */}
      <main className="content-area">
        {loading && activeTab === 'explore' ? (
          <div className="status-msg">관광 정보를 불러오는 중입니다... ⏳</div>
        ) : error && activeTab === 'explore' ? (
          <div className="status-msg error">{error}</div>
        ) : displayList.length === 0 ? (
          <div className="status-msg">
            {activeTab === 'explore'
              ? '표시할 관광 정보가 없습니다.'
              : '아직 찜한 관광지가 없습니다. 하트를 눌러 보관함에 추가해보세요!'}
          </div>
        ) : (
          <div className="card-grid">
            {displayList.map((item) => {
              const isSaved = !!bookmarks[item.contentid];
              return (
                <div key={item.contentid} className="tour-card">
                  <div className="card-image-box">
                    {item.firstimage ? (
                      <img src={item.firstimage} alt={item.title} loading="lazy" />
                    ) : (
                      <div className="no-image">
                        <ImageOff size={32} />
                        <span>이미지 없음</span>
                      </div>
                    )}
                    <button
                      className={`heart-btn ${isSaved ? 'saved' : ''}`}
                      onClick={() => toggleBookmark(item)}
                      title={isSaved ? '찜 취소' : '찜하기'}
                    >
                      <Heart size={20} fill={isSaved ? '#ff4d6d' : 'none'} color={isSaved ? '#ff4d6d' : '#555'} />
                    </button>
                  </div>
                  
                  <div className="card-body">
                    <h3 className="card-title">{item.title}</h3>
                    <p className="card-addr">
                      <MapPin size={14} /> {item.addr1 || '상세 주소 미제공'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;