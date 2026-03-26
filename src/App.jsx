import './App.css'

const mapsUrl =
  'https://www.google.es/maps/@40.2632148,-3.8341746,3a,75y,90h,90t/data=!3m7!1e1!3m5!1sMQ1JnwW6nLd95gtzeJ7c8w!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D0%26panoid%3DMQ1JnwW6nLd95gtzeJ7c8w%26yaw%3D90!7i16384!8i8192?entry=ttu&g_ep=EgoyMDI2MDMyMy4xIKXMDSoASAFQAw%3D%3D'

const gatePhotoUrl =
  'https://streetviewpixels-pa.googleapis.com/v1/thumbnail?cb_client=maps_sv.tactile&w=900&h=600&pitch=0&panoid=MQ1JnwW6nLd95gtzeJ7c8w&yaw=90'

const highlights = [
  {
    title: 'Acceso comodo y maniobra sencilla',
    text: 'Terreno hormigonado y pensado para entrar, aparcar y salir con comodidad, tambien para caravanas, autocaravanas y remolques de mayor tamaño.',
  },
  {
    title: 'Tranquilidad entre viajes',
    text: 'Deja tu caravana en un punto comodo y accesible para que tengas la tranquilidad de encontrarla cuando la necesites.',
  },
  {
    title: 'Informacion directa',
    text: 'Ubicacion en poligono industrial, precio claro, contacto directo y acceso en Google Maps para decidir rapido y sin vueltas.',
  },
]

const services = [
  'Acceso comodo para vehiculos de gran tamaño',
  'Terreno hormigonado en poligono industrial',
  'Precio claro y directo: 60 euros al mes',
  'Muy cerca de Fuenlabrada, Humanes y Moraleja de En Medio',
]

const steps = [
  'Ponte en contacto conmigo.',
  'Verifica disponibilidad.',
  'Te dare las instrucciones de entrada.',
]

function App() {
  return (
    <main className="page-shell" id="top">
      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">Serviparking</p>
          <h1>Tu caravana, en un espacio seguro, accesible y con precio claro.</h1>
          <p className="lead">
            Web orientada a convertir visitas en consultas reales sobre
            disponibilidad, acceso y estancia.
          </p>
          <div className="hero-actions">
            <a className="primary-action" href="#contacto">
              Solicitar informacion
            </a>
            <a className="secondary-action" href="#servicios">
              Ver servicios
            </a>
          </div>
        </div>

        <aside className="hero-panel" aria-label="Informacion principal del espacio">
          <p className="panel-label">Que ofrecemos</p>
          <div className="hero-panel-grid">
            <div>
              <span className="hero-panel-key">Aparcamiento</span>
              <p>Hormigonado y dentro de poligono industrial.</p>
            </div>
            <div>
              <span className="hero-panel-key">Direccion</span>
              <p>Calle Malva 4, Humanes</p>
            </div>
            <div>
              <span className="hero-panel-key">Ubicacion</span>
              <p>Muy cerca de Fuenlabrada, Humanes y Moraleja de En Medio.</p>
            </div>
            <div>
              <span className="hero-panel-key">Telefono</span>
              <a href="tel:+34649448383">+34 649 448 383</a>
            </div>
            <div>
              <span className="hero-panel-key">Email</span>
              <a href="mailto:ganiveamaja@gmail.com">ganiveamaja@gmail.com</a>
            </div>
            <div>
              <span className="hero-panel-key">Precio</span>
              <p className="hero-panel-price">60 euros al mes</p>
            </div>
          </div>
          <a className="hero-panel-link" href={mapsUrl} target="_blank" rel="noreferrer">
            Ver en Google Maps
          </a>
        </aside>
      </section>

      <section className="highlights-grid" aria-label="Ventajas principales">
        {highlights.map((item) => (
          <article className="info-card" key={item.title}>
            <h2>{item.title}</h2>
            <p>{item.text}</p>
          </article>
        ))}
      </section>

      <section className="split-section" id="servicios">
        <div>
          <p className="section-kicker">Ventajas</p>
          <h2>Una propuesta clara para alquilar plaza sin complicaciones.</h2>
        </div>

        <div className="service-list">
          {services.map((service, index) => (
            <div className="service-row" key={service}>
              <span className="service-mark">
                {String(index + 1).padStart(2, '0')}
              </span>
              <p>{service}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="process-section">
        <div className="process-header">
          <p className="section-kicker">Proceso</p>
          <h2>Reservar tu plaza es rapido y directo.</h2>
        </div>

        <div className="process-grid">
          {steps.map((step, index) => (
            <article className="process-card" key={step}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <p>{step}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="contact-section" id="contacto">
        <div>
          <p className="section-kicker">Contacto</p>
          <h2>Solicita tu plaza mensual y recibe respuesta directa.</h2>
        </div>

        <div className="contact-card">
          <div className="contact-details">
            <div>
              <span className="contact-label">Telefono</span>
              <a href="tel:+34649448383">+34 649 448 383</a>
            </div>
            <div>
              <span className="contact-label">Email</span>
              <a href="mailto:ganiveamaja@gmail.com">ganiveamaja@gmail.com</a>
            </div>
            <div>
              <span className="contact-label">Precio</span>
              <p>60 euros al mes</p>
            </div>
            <div>
              <span className="contact-label">Direccion</span>
              <p>Calle Malva 4, Humanes</p>
            </div>
          </div>
          <a
            className="gate-preview"
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
          >
            <img src={gatePhotoUrl} alt="Vista de la puerta desde Google Maps" />
            <span>Ver en Google Maps</span>
          </a>
          <a className="primary-action" href="tel:+34649448383">
            Llamar ahora
          </a>
        </div>
      </section>
    </main>
  )
}

export default App
