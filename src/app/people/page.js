import Link from "next/link";

export default function People() {
  const professor = {
    name: "선 종호 (Seon, Jongho)",
    field: "Space Science Payload, Data Analysis",
    email: "jhseon@khu.ac.kr",
    position: "Professor",
    education: [
      "학사: 한국과학기술원 물리학과",
      "석사: Dept. of Physics and Astronomy, University of Iowa, Iowa City, USA",
      "박사: Dept. of Physics and Astronomy, University of Iowa, Iowa City, USA"
    ],
    career: [
      "한국과학기술원 인공위성연구센터",
      "현대전자 위성사업단",
      "(주)쎄트렉아이 우주기술연구소",
      "한국과학기술원 물리학과 겸직교수",
      "UC, Berkeley 우주과학연구소 객원교수",
      "한국우주과학회 학술이사/편집장"
    ],
    image: "/professor.jpg"
  };

  const researchers = [
    {
      name: "나고운 (Go-Woon Na)",
      field: "Digital electronics, Particle detector, Space weather",
      email: "gwna@khu.ac.kr",
      position: "Research Professor",
      phd: "Ehwa Womans University (2016)",
      image: "/researcher1.jpg"
    },
    {
      name: "안범수 (Beom-Su An)",
      field: "Particle detector, Digital electronics, Space weather",
      email: "bumsuan@khu.ac.kr",
      position: "Master course",
      image: "/researcher2.jpg"
    },
    {
      name: "오민혁 (Min-Hyuk Oh)",
      field: "Digital electronics, Particle detector, Space weather",
      email: "alsgur0108@khu.ac.kr",
      position: "Master course",
      image: "/researcher3.jpg"
    },
    {
      name: "김성진 (Sung-Jin Kim)",
      field: "Particle detector, Digital electronics, Space weather",
      email: "kimsungjin00@khu.ac.kr",
      position: "Master course",
      image: "/researcher4.jpg"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex space-x-8">
              <Link 
                href="/" 
                className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
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
                className="text-gray-900 border-b-2 border-orange-500 px-3 py-2 text-sm font-medium"
                style={{ color: '#ed6c1c' }}
              >
                People
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold text-center" 
              style={{ fontFamily: 'Pretendard, sans-serif', color: '#ed6c1c' }}>
            연구실 구성원
          </h1>
          <p className="text-gray-600 text-center mt-4">
            Space Science Instrument Laboratory Members
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-16">
        {/* Professor Section */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-8" 
              style={{ fontFamily: 'Pretendard, sans-serif' }}>교수</h2>
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-shrink-0">
              <div className="w-48 h-64 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-lg font-medium">교수님</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-4">{professor.name}</h3>
              <div className="space-y-3">
                <div>
                  <span className="font-semibold text-gray-700">연구분야:</span>
                  <span className="ml-2 text-gray-600">{professor.field}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">E-mail:</span>
                  <span className="ml-2 text-blue-600">{professor.email}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Position:</span>
                  <span className="ml-2 text-gray-600">{professor.position}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">학력:</span>
                  <ul className="ml-2 mt-2 space-y-1">
                    {professor.education.map((edu, index) => (
                      <li key={index} className="text-gray-600 text-sm">• {edu}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">주요경력:</span>
                  <ul className="ml-2 mt-2 space-y-1">
                    {professor.career.map((career, index) => (
                      <li key={index} className="text-gray-600 text-sm">• {career}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Researchers Section */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-8" 
              style={{ fontFamily: 'Pretendard, sans-serif' }}>연구진</h2>
          <div className="space-y-12">
            {researchers.map((researcher, index) => (
              <article key={index} className="border-b border-gray-200 pb-12 last:border-b-0 last:pb-0">
                <div className="flex flex-col lg:flex-row gap-8">
                  <div className="flex-shrink-0">
                    <div className={`w-48 h-64 rounded-lg flex items-center justify-center ${
                      researcher.position === "Research Professor" 
                        ? "bg-gradient-to-br from-green-100 to-green-200" 
                        : "bg-gradient-to-br from-purple-100 to-purple-200"
                    }`}>
                      <span className={`text-lg font-medium ${
                        researcher.position === "Research Professor" 
                          ? "text-green-600" 
                          : "text-purple-600"
                      }`}>
                        {researcher.position === "Research Professor" ? "연구교수" : "석사과정"}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{researcher.name}</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="font-semibold text-gray-700">연구분야:</span>
                        <span className="ml-2 text-gray-600">{researcher.field}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">E-mail:</span>
                        <span className="ml-2 text-blue-600">{researcher.email}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">Position:</span>
                        <span className="ml-2 text-gray-600">{researcher.position}</span>
                      </div>
                      {researcher.phd && (
                        <div>
                          <span className="font-semibold text-gray-700">Ph.D:</span>
                          <span className="ml-2 text-gray-600">{researcher.phd}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h3 className="font-semibold text-gray-900 mb-2">
            경희대학교 우주과학탑재체연구실
          </h3>
          <p className="text-sm text-gray-600 mb-1">
            Space Science Instrument Laboratory
          </p>
          <p className="text-sm text-gray-500 mb-1">
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
