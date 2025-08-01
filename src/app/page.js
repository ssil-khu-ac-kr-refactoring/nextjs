import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex space-x-8">
              <Link 
                href="/" 
                className="text-gray-900 border-b-2 border-orange-500 px-3 py-2 text-sm font-medium"
                style={{ color: '#ed6c1c' }}
              >
                Home
              </Link>
              <Link 
                href="/about" 
                className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
              >
                About
              </Link>
              <Link 
                href="/people" 
                className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
              >
                People
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="bg-gradient-to-br from-blue-50 to-indigo-100 py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-6" 
              style={{ fontFamily: 'Pretendard, sans-serif', color: '#ed6c1c' }}>
            우주과학탑재체연구실
          </h1>
          <h2 className="text-2xl text-gray-700 mb-8" 
              style={{ fontFamily: 'Pretendard, sans-serif' }}>
            Space Science Instrument Laboratory
          </h2>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
            우주 환경 연구를 위한 과학탑재체 개발과 우주환경 데이터 분석을 통해 
            우주과학 발전에 기여하는 연구실입니다.
          </p>
          <div className="flex gap-4 items-center justify-center">
            <Link
              href="/about"
              className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-8 py-4 rounded-lg transition-colors"
              style={{ backgroundColor: '#ed6c1c' }}
            >
              연구실 소개
            </Link>
            <Link
              href="/people"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-8 py-4 rounded-lg transition-colors"
            >
              구성원 보기
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        {/* Research Highlights */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center" 
              style={{ fontFamily: 'Pretendard, sans-serif' }}>
            주요 연구분야
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🛰️</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">우주과학탑재체</h3>
              <p className="text-gray-600">위성 탑재용 과학기기 개발 및 우주환경 관측</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">데이터 분석</h3>
              <p className="text-gray-600">우주환경 데이터 처리 및 분석 기술 연구</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌌</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">우주환경</h3>
              <p className="text-gray-600">우주날씨 및 우주환경 변화 연구</p>
            </div>
          </div>
        </section>

        {/* Latest News */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center" 
              style={{ fontFamily: 'Pretendard, sans-serif' }}>
            최근 소식
          </h2>
          <div className="space-y-6">
            <article className="border-b border-gray-200 pb-6">
              <div className="flex items-start gap-4">
                <div className="text-sm text-gray-500 min-w-[100px]">2024.01.15</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    우주과학탑재체 개발 프로젝트 착수
                  </h3>
                  <p className="text-gray-600">
                    차세대 위성용 입자검출기 개발을 위한 새로운 연구가 시작되었습니다.
                  </p>
                </div>
              </div>
            </article>
            <article className="border-b border-gray-200 pb-6">
              <div className="flex items-start gap-4">
                <div className="text-sm text-gray-500 min-w-[100px]">2024.01.10</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    국제 우주과학 학회 발표
                  </h3>
                  <p className="text-gray-600">
                    우주환경 데이터 분석 결과를 국제학회에서 발표하였습니다.
                  </p>
                </div>
              </div>
            </article>
            <article>
              <div className="flex items-start gap-4">
                <div className="text-sm text-gray-500 min-w-[100px]">2024.01.05</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    신입 연구원 모집
                  </h3>
                  <p className="text-gray-600">
                    우주과학 분야 석사과정 신입생을 모집합니다.
                  </p>
                </div>
              </div>
            </article>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h3 className="font-semibold text-gray-900 mb-2" 
              style={{ fontFamily: 'Pretendard, sans-serif' }}>
            경희대학교 우주과학탑재체연구실
          </h3>
          <p className="text-sm text-gray-600 mb-1">
            Space Science Instrument Laboratory
          </p>
          <p className="text-sm text-gray-500 mb-4">
            주소. (우)17104 경기도 용인시 기흥구 덕영대로 1732 경희대학교 국제캠퍼스 천문대
          </p>
          <p className="text-xs text-gray-400">
            Copyright © ssil.khu.ac.kr All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
