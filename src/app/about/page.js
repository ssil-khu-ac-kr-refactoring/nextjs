import Link from "next/link";

export default function About() {
  const researchProjects = [
    {
      title: "달우주환경모니터 (LUSEM)",
      description: "NASA 아르테미스 임무의 Commercial Lunar Payload Service (CLPS) 프로젝트에 참여하여 개발 중인 탑재체입니다.",
      details: "달 표면에서뿐만 아니라 지구에서부터 달로 가는 동안에도 전하를 띤 입자를 관측할 예정입니다.",
      status: "개발 중"
    },
    {
      title: "우주기상탑재체 (KSEM)",
      description: "정지궤도복합위성-2A호(천리안2A)에 탑재된 우주기상 관측 장비입니다.",
      details: "2018년 12월 발사 후 현재까지 성공적으로 임무를 수행하고 있습니다.",
      status: "운영 중"
    },
    {
      title: "중에너지 입자검출기 (MEPD)",
      description: "차세대소형위성1호(NEXTSat-1)에 탑재된 입자 검출 장비입니다.",
      details: "2018년 12월 발사되어 우주환경과 전하를 띤 우주입자와의 상호관계에 대한 연구를 수행하고 있습니다.",
      status: "운영 중"
    }
  ];

  const collaborations = [
    {
      category: "국제 협력",
      partners: ["NASA", "ESA", "UC Berkeley", "Intuitive Machines"]
    },
    {
      category: "국내 협력",
      partners: ["한국천문연구원", "한국항공우주연구원", "KAIST 인공위성연구센터", "(주)쎄트렉아이"]
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex justify-center space-x-8">
            <Link 
              href="/" 
              className="text-gray-600 hover:text-[#ed6c1c] font-medium transition-colors"
            >
              홈
            </Link>
            <Link 
              href="/about" 
              className="text-[#ed6c1c] font-medium border-b-2 border-[#ed6c1c] pb-1"
            >
              연구실 소개
            </Link>
            <Link 
              href="/people" 
              className="text-gray-600 hover:text-[#ed6c1c] font-medium transition-colors"
            >
              구성원
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-[#ed6c1c] mb-2">
              연구실 소개
            </h1>
            <p className="text-gray-600">
              경희대학교 우주과학탑재체연구실 (Space Science Instrument Laboratory)
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-16">
        {/* Introduction Section */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-8">연구실 개요</h2>
          <div className="prose prose-lg max-w-none">
            <p className="mb-6 text-gray-700 leading-relaxed">
              예로부터 사람들은 우주에 대한 막연한 동경부터 짤막한 호기심에 이르기까지 다양한 관심들을 표현해 왔습니다. 
              이제는 우주여행조차 더이상 머나먼 상상이 아닌 시대에 이르렀습니다. 이러한 시대에도 불구하고, 또한 이러한 시대이기에, 
              사람들은 우주 현상에 대한 과학적 이해를 더욱 필요로 하고 있으며, 이를 위해서는 우주 공간에서 다양한 종류의 
              관측 자료가 필요한 실정입니다.
            </p>
            <p className="mb-6 text-gray-700 leading-relaxed">
              우주과학탑재체 연구실(Space Science Instrument Laboratory, SSIL)은 여기에 초점을 맞춰 연구하는 곳입니다. 
              우주과학탑재체 연구실은 2009년부터 경희대학교 천문대에 마련되어 천문학 및 우주과학의 기초 연구와 
              그를 위한 위성 탑재체 개발 연구를 수행하고 있습니다.
            </p>
            <p className="text-gray-700 leading-relaxed">
              위성 탑재체는 우주과학 및 우주탐사 연구에서 중요한 역할을 하는 것 중 하나로 우주 공간에서 
              직접적인 관측이 가능하도록 하는 중요한 도구입니다. 그래서 우주과학탑재체 연구실에서는 여러 국제 및 국내 협력을 통해 
              위성 탑재체, 그 중에서도 특히 입자검출기 개발에 주력하고 있습니다.
            </p>
          </div>
        </section>

        {/* Research Projects Section */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-8">주요 연구 프로젝트</h2>
          <div className="space-y-8">
            {researchProjects.map((project, index) => (
              <article key={index} className="border-l-4 border-blue-500 pl-6 py-2">
                <div className="flex flex-wrap justify-between items-start mb-3">
                  <h3 className="text-xl font-semibold text-gray-900">{project.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    project.status === "운영 중" 
                      ? "bg-green-100 text-green-700" 
                      : "bg-blue-100 text-blue-700"
                  }`}>
                    {project.status}
                  </span>
                </div>
                <p className="text-gray-800 mb-2 font-medium">{project.description}</p>
                <p className="text-gray-600">{project.details}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Collaborations Section */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-8">협력 기관</h2>
          <div className="grid gap-8 md:grid-cols-2">
            {collaborations.map((collab, index) => (
              <div key={index}>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{collab.category}</h3>
                <ul className="space-y-2">
                  {collab.partners.map((partner, partnerIndex) => (
                    <li key={partnerIndex} className="text-gray-700 flex items-center">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3"></span>
                      {partner}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Research Focus Section */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-8">연구 분야</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 text-xl">🛰️</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">위성 탑재체 개발</h3>
              <p className="text-gray-600 text-sm">우주 환경에서 작동하는 각종 관측 장비 및 입자검출기 개발</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-600 text-xl">🔬</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">우주환경 연구</h3>
              <p className="text-gray-600 text-sm">전하를 띤 우주입자와 우주환경의 상호관계에 대한 연구</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 text-xl">🌙</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">달 탐사 연구</h3>
              <p className="text-gray-600 text-sm">지구자기장과 달의 상호작용 및 달 표면 고에너지 입자 관측</p>
            </div>
          </div>
        </section>

        {/* Vision Section */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-8">비전과 목표</h2>
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 leading-relaxed mb-6">
              우주과학탑재체 연구실에서 함께 했던 대부분의 사람들은 계속 우주과학 관련 업계에서 종사하고 있습니다. 
              어떤 이는 더 본질적인 연구를 위해 해외로, 어떤 이는 우주과학 개발의 생생한 현장을 느낄 수 있는 산업체로, 
              서로 함께 하던 시기를 거쳐 각자의 삶을 살아가지만, 한가지 확실한 것은 모든 이들이 우주과학을 향한 
              끊임없는 학문적 관심과 목표를 가지고 함께하고 있다는 것입니다.
            </p>
            <blockquote className="border-l-4 border-blue-500 pl-6 py-3 bg-blue-50 rounded-r-lg">
              <p className="text-blue-800 font-medium italic">
                &ldquo;우주 현상에 대한 과학적 이해를 통해 인류의 우주 탐사에 기여한다&rdquo;
              </p>
            </blockquote>
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
