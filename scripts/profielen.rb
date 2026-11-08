#!/usr/bin/env ruby
# frozen_string_literal: true

# Profielen controleren en ophalen. Zie docs/ARCHITECTURE.md, onder Profiel.
#
#   ruby scripts/profielen.rb controleer   # alle profielen, de software en de organisaties tegen de schema's, en alle verwijzingen
#   ruby scripts/profielen.rb ophalen      # profielen van een extern domein ophalen, controleren en opslaan
#   ruby scripts/profielen.rb paginas      # een pagina maken voor software (_software/<id>.md) en aanbieders
#                                          # (_aanbieders/<id>.md) die er nog geen hebben
#   ruby scripts/profielen.rb iconen       # logo's van buiten downloaden naar assets/images/iconen/ en het
#                                          # pad in de data zetten: geen verzoeken naar derden vanuit de browser
#
# Het register (_data/profielregister.json) zegt welke profielen er zijn en waar ze staan.
# Een dienst verwijst naar software (_data/software.json) en naar de organisatie die hem aanbiedt
# (_data/organisaties.json); die id's moeten bestaan.
# Profielen op https://opendiensten.nl/profielen/ beheren we zelf in _data/profielen/<id>.json.
# Andere profielen haalt `ophalen` op; een profiel dat niet klopt, wordt overgeslagen en de vorige versie blijft staan.
#
# De controle volgt de JSON Schema's in _data/schemas/ (gepubliceerd op /schemas/), zonder extra gems.

require 'json'
require 'net/http'
require 'uri'

ROOT = File.expand_path('..', __dir__)
REGISTER = File.join(ROOT, '_data', 'profielregister.json')
PROFIELEN = File.join(ROOT, '_data', 'profielen')
SOFTWARE = File.join(ROOT, '_data', 'software.json')
ORGANISATIES = File.join(ROOT, '_data', 'organisaties.json')
# Per lijst: waar de pagina's staan, welk veld in de front matter, en welke sleutel in bekend
PAGINAS = [
  { map: File.join(ROOT, '_software'), veld: 'software', bekend: 'software', lijst: SOFTWARE, sleutel: 'software' },
  { map: File.join(ROOT, '_aanbieders'), veld: 'aanbieder', bekend: 'aanbieder', lijst: ORGANISATIES, sleutel: 'organisaties' }
].freeze
EIGEN_URL = 'https://opendiensten.nl/profielen/'
SLUG = /\A[a-z0-9]+(-[a-z0-9]+)*\z/
HTTP_URL = %r{\Ahttps?://}

DIENST_VELDEN = %w[id naam software beschrijving categorie url random_url favicon aanbieder beheer
                   spoelkeuken_url eu_hosting doelgroep soort status open redenen].freeze
SOORTEN = %w[dienst infrastructuur].freeze
URL_VELDEN = %w[url random_url spoelkeuken_url].freeze
TEKST_VELDEN = %w[naam beschrijving doelgroep].freeze
SOFTWARE_VELDEN = %w[id naam beschrijving logo website broncode open_source].freeze
ORGANISATIE_VELDEN = %w[id naam beschrijving website logo land].freeze
STATUSSEN = %w[live disabled discontinued].freeze
REDENEN = %w[account betaald gesloten buiten-eu].freeze
PROFIEL_VELDEN = %w[$schema versie id naam beschrijving website logo diensten].freeze

# Tekst uit een profiel komt op de site; geen HTML erin
def tekst_fouten(waarde, pad)
  return [] unless waarde.is_a?(String)

  waarde.match?(/[<>]/) ? ["#{pad}: geen < of > toegestaan"] : []
end

# bekend: { 'software' => [id's], 'aanbieder' => [id's] }, uit _data/software.json en _data/organisaties.json
def controleer_dienst(d, pad, bekend)
  return ["#{pad}: moet een object zijn"] unless d.is_a?(Hash)

  fouten = []
  (d.keys - DIENST_VELDEN).each { |k| fouten << "#{pad}: onbekend veld '#{k}'" }
  %w[id naam categorie url].each { |k| fouten << "#{pad}: '#{k}' ontbreekt" unless d.key?(k) }
  fouten << "#{pad}.id: alleen kleine letters, cijfers en streepjes" if d['id'] && !d['id'].to_s.match?(SLUG)
  fouten << "#{pad}.categorie: alleen kleine letters, cijfers en streepjes" if d['categorie'] && !d['categorie'].to_s.match?(SLUG)
  URL_VELDEN.each do |k|
    fouten << "#{pad}.#{k}: moet beginnen met http:// of https://" if d.key?(k) && !d[k].to_s.match?(HTTP_URL)
  end
  if d.key?('favicon') && !(d['favicon'].to_s.start_with?('/') || d['favicon'].to_s.match?(HTTP_URL))
    fouten << "#{pad}.favicon: een pad op opendiensten.nl of een URL"
  end
  TEKST_VELDEN.each { |k| fouten.concat(tekst_fouten(d[k], "#{pad}.#{k}")) }
  { 'software' => 'software.json', 'aanbieder' => 'organisaties.json', 'beheer' => 'organisaties.json' }.each do |k, lijst|
    next unless d.key?(k)

    if !d[k].to_s.match?(SLUG)
      fouten << "#{pad}.#{k}: een id uit #{lijst}"
    elsif !bekend[k == 'beheer' ? 'aanbieder' : k].include?(d[k])
      fouten << "#{pad}.#{k}: '#{d[k]}' staat niet in #{lijst}; voeg hem daar toe"
    end
  end
  fouten << "#{pad}.soort: een van #{SOORTEN.join(', ')}" if d.key?('soort') && !SOORTEN.include?(d['soort'])
  fouten << "#{pad}.status: een van #{STATUSSEN.join(', ')}" if d.key?('status') && !STATUSSEN.include?(d['status'])
  %w[eu_hosting open].each do |k|
    fouten << "#{pad}.#{k}: true of false" if d.key?(k) && ![true, false].include?(d[k])
  end
  if d.key?('redenen')
    if !d['redenen'].is_a?(Array) || (d['redenen'] - REDENEN).any?
      fouten << "#{pad}.redenen: een lijst met #{REDENEN.join(', ')}"
    end
  end
  fouten
end

def controleer_profiel(p, bekend, verwacht_id = nil)
  return ['profiel: moet een object zijn'] unless p.is_a?(Hash)

  fouten = []
  (p.keys - PROFIEL_VELDEN).each { |k| fouten << "onbekend veld '#{k}'" }
  %w[versie id naam diensten].each { |k| fouten << "'#{k}' ontbreekt" unless p.key?(k) }
  fouten << 'versie: moet 1 zijn' if p.key?('versie') && p['versie'] != 1
  fouten << 'id: alleen kleine letters, cijfers en streepjes' if p['id'] && !p['id'].to_s.match?(SLUG)
  fouten << "id: '#{p['id']}' hoort '#{verwacht_id}' te zijn, zoals in het register" if verwacht_id && p['id'] != verwacht_id
  fouten << 'website: moet beginnen met http:// of https://' if p.key?('website') && !p['website'].to_s.match?(HTTP_URL)
  if p.key?('logo') && !(p['logo'].to_s.start_with?('/') || p['logo'].to_s.start_with?('https://'))
    fouten << 'logo: een pad op opendiensten.nl of een https-URL'
  end
  %w[naam beschrijving].each { |k| fouten.concat(tekst_fouten(p[k], k)) }

  unless p['diensten'].is_a?(Array)
    fouten << 'diensten: moet een lijst zijn'
    return fouten
  end

  ids = []
  p['diensten'].each_with_index do |d, i|
    pad = "diensten[#{i}]"
    if d.is_a?(Hash) && d.key?('ref')
      (d.keys - %w[ref bron url]).each { |k| fouten << "#{pad}: onbekend veld '#{k}' in verwijzing" }
      fouten << "#{pad}.url: moet beginnen met http:// of https://" if d.key?('url') && !d['url'].to_s.match?(HTTP_URL)
      fouten << "#{pad}.ref: alleen kleine letters, cijfers en streepjes" unless d['ref'].to_s.match?(SLUG)
      fouten << "#{pad}.bron: moet een https-URL zijn" if d.key?('bron') && !d['bron'].to_s.start_with?('https://')
    else
      fouten.concat(controleer_dienst(d, pad, bekend))
      ids << d['id'] if d.is_a?(Hash)
    end
  end
  dubbel = ids.tally.select { |_, n| n > 1 }.keys
  fouten << "dubbele id's: #{dubbel.join(', ')}" if dubbel.any?
  fouten
end

def lees_register
  register = JSON.parse(File.read(REGISTER))
  fouten = []
  fouten << 'register: versie moet 1 zijn' unless register['versie'] == 1
  fouten << 'register: standaard ontbreekt' unless register['standaard']
  (register['profielen'] || []).each do |r|
    fouten << "register: id '#{r['id']}' ongeldig" unless r['id'].to_s.match?(SLUG)
    fouten << "register: url van '#{r['id']}' moet een https-URL zijn" unless r['url'].to_s.start_with?('https://')
  end
  ids = (register['profielen'] || []).map { |r| r['id'] }
  fouten << "register: standaard '#{register['standaard']}' staat niet in de lijst" unless ids.include?(register['standaard'])
  [register, fouten]
end

def bestand(id) = File.join(PROFIELEN, "#{id}.json")

# Een lijst (software of organisaties) controleren: velden, id's, URL's, geen HTML
def controleer_lijst(pad, sleutel, velden)
  data = JSON.parse(File.read(pad))
  naam = File.basename(pad)
  fouten = []
  fouten << "#{naam}: versie moet 1 zijn" unless data['versie'] == 1
  items = data[sleutel]
  return [[], fouten << "#{naam}: '#{sleutel}' moet een lijst zijn"] unless items.is_a?(Array)

  items.each_with_index do |x, i|
    plek = "#{naam}: #{sleutel}[#{i}]"
    next fouten << "#{plek}: moet een object zijn" unless x.is_a?(Hash)

    (x.keys - velden).each { |k| fouten << "#{plek}: onbekend veld '#{k}'" }
    %w[id naam].each { |k| fouten << "#{plek}: '#{k}' ontbreekt" unless x.key?(k) }
    fouten << "#{plek}.id: alleen kleine letters, cijfers en streepjes" unless x['id'].to_s.match?(SLUG)
    %w[naam beschrijving].each { |k| fouten.concat(tekst_fouten(x[k], "#{plek}.#{k}")) }
    fouten << "#{plek}.website: moet beginnen met http:// of https://" if x.key?('website') && !x['website'].to_s.match?(HTTP_URL)
    if x.key?('logo') && !(x['logo'].to_s.start_with?('/') || x['logo'].to_s.start_with?('https://'))
      fouten << "#{plek}.logo: een pad op opendiensten.nl of een https-URL"
    end
    fouten << "#{plek}.land: twee hoofdletters, bv. NL" if x.key?('land') && !x['land'].to_s.match?(/\A[A-Z]{2}\z/)
    fouten << "#{plek}.broncode: moet beginnen met https://" if x.key?('broncode') && !x['broncode'].to_s.start_with?('https://')
    fouten << "#{plek}.open_source: true of false" if x.key?('open_source') && ![true, false].include?(x['open_source'])
  end
  ids = items.select { |x| x.is_a?(Hash) }.map { |x| x['id'] }
  dubbel = ids.tally.select { |_, n| n > 1 }.keys
  fouten << "#{naam}: dubbele id's: #{dubbel.join(', ')}" if dubbel.any?
  [ids, fouten]
rescue JSON::ParserError => e
  [[], ["#{File.basename(pad)}: geen geldige JSON (#{e.message.lines.first.strip})"]]
end

def lees_bekend
  software, fouten_s = controleer_lijst(SOFTWARE, 'software', SOFTWARE_VELDEN)
  organisaties, fouten_o = controleer_lijst(ORGANISATIES, 'organisaties', ORGANISATIE_VELDEN)
  [{ 'software' => software, 'aanbieder' => organisaties }, fouten_s + fouten_o]
end

def controleer
  register, fouten = lees_register
  bekend, lijst_fouten = lees_bekend
  fouten.concat(lijst_fouten)
  profielen = {}

  register['profielen'].each do |r|
    pad = bestand(r['id'])
    unless File.exist?(pad)
      fouten << "#{r['id']}: #{pad.sub("#{ROOT}/", '')} ontbreekt (nog niet opgehaald?)"
      next
    end
    profiel = JSON.parse(File.read(pad))
    controleer_profiel(profiel, bekend, r['id']).each { |f| fouten << "#{r['id']}: #{f}" }
    profielen[r['id']] = profiel
  rescue JSON::ParserError => e
    fouten << "#{r['id']}: geen geldige JSON (#{e.message.lines.first.strip})"
  end

  # Verwijzingen: bestaat de dienst in de bron?
  url_naar_id = register['profielen'].to_h { |r| [r['url'], r['id']] }
  profielen.each do |id, profiel|
    (profiel['diensten'] || []).each_with_index do |d, i|
      next unless d.is_a?(Hash) && d['ref']

      bron_id = d['bron'] ? url_naar_id[d['bron']] : register['standaard']
      if bron_id.nil?
        fouten << "#{id}: diensten[#{i}].bron #{d['bron']} staat niet in het register"
      else
        doel = (profielen[bron_id]&.dig('diensten') || []).find { |x| x.is_a?(Hash) && x['id'] == d['ref'] }
        if doel.nil?
          fouten << "#{id}: diensten[#{i}] verwijst naar '#{d['ref']}', maar die staat niet in #{bron_id}"
        elsif d['url'] && doel['open'] != false && doel['soort'] != 'infrastructuur'
          fouten << "#{id}: diensten[#{i}].url: alleen bij een dienst die geen open dienst is; " \
                    "'#{d['ref']}' is een open dienst, daarmee maak je steeds een nieuwe link"
        end
      end
    end
  end

  # Bestanden in _data/profielen die niet in het register staan, worden niet gebruikt
  geregistreerd = register['profielen'].map { |r| r['id'] }
  Dir[File.join(PROFIELEN, '*.json')].each do |f|
    id = File.basename(f, '.json')
    warn "let op: #{f.sub("#{ROOT}/", '')} staat niet in het register en wordt niet gebruikt" unless geregistreerd.include?(id)
  end

  # Elke software en aanbieder heeft een pagina (_software/<id>.md, _aanbieders/<id>.md), en elke pagina hoort ergens bij
  PAGINAS.each do |pg|
    map = File.basename(pg[:map])
    paginas = Dir[File.join(pg[:map], '*.md')].map { |f| File.basename(f, '.md') }
    (bekend[pg[:bekend]] - paginas).each do |id|
      fouten << "#{map}/#{id}.md ontbreekt; maak hem met: ruby scripts/profielen.rb paginas"
    end
    (paginas - bekend[pg[:bekend]]).each { |id| fouten << "#{map}/#{id}.md hoort bij niets in #{File.basename(pg[:lijst])}" }
  end

  extern = File.read(SOFTWARE).scan(/"logo": "https?:/).size + File.read(ORGANISATIES).scan(/"logo": "https?:/).size +
           Dir[File.join(PROFIELEN, '*.json')].sum { |f| File.read(f).scan(/"(?:logo|favicon)": "https?:/).size }
  warn "let op: #{extern} logo's staan nog op een andere site; maak ze lokaal met: ruby scripts/profielen.rb iconen" if extern.positive?

  if fouten.empty?
    puts "Alle #{profielen.size} profielen, #{bekend['software'].size} software en #{bekend['aanbieder'].size} organisaties kloppen."
  else
    puts fouten.map { |f| "✗ #{f}" }
    exit 1
  end
end

def haal_op(url, rest = 3)
  uri = URI(url)
  raise "alleen https: #{url}" unless uri.scheme == 'https'

  Net::HTTP.start(uri.host, uri.port, use_ssl: true, open_timeout: 10, read_timeout: 10) do |http|
    antwoord = http.get(uri.request_uri, 'Accept' => 'application/json', 'User-Agent' => 'OpenDiensten-profielen')
    case antwoord
    when Net::HTTPRedirection
      raise 'te veel doorverwijzingen' if rest.zero?

      haal_op(URI.join(url, antwoord['location']).to_s, rest - 1)
    when Net::HTTPSuccess
      raise 'groter dan 1 MB' if antwoord.body.bytesize > 1_000_000

      antwoord.body
    else
      raise "HTTP #{antwoord.code}"
    end
  end
end

def ophalen
  register, fouten = lees_register
  bekend, lijst_fouten = lees_bekend
  fouten.concat(lijst_fouten)
  abort fouten.join("\n") if fouten.any?

  extern = register['profielen'].reject { |r| r['url'].start_with?(EIGEN_URL) }
  puts 'Geen externe profielen in het register.' if extern.empty?

  extern.each do |r|
    profiel = JSON.parse(haal_op(r['url']))
    fouten = controleer_profiel(profiel, bekend, r['id'])
    if fouten.any?
      warn "✗ #{r['id']} (#{r['url']}) overgeslagen:\n  #{fouten.join("\n  ")}"
      next
    end
    File.write(bestand(r['id']), JSON.pretty_generate(profiel) + "\n")
    puts "✓ #{r['id']} opgehaald van #{r['url']}"
  rescue StandardError => e
    warn "✗ #{r['id']} (#{r['url']}) overgeslagen: #{e.message}"
  end
end

ICONEN = File.join(ROOT, 'assets', 'images', 'iconen')
EXTERN = %r{\Ahttps?://}

# Een icoon downloaden; geeft het pad op de site terug, of nil als het niet lukt
def icoon_downloaden(url, soort, id)
  data = haal_op_binair(url)
  ext = if data.start_with?("\x89PNG".b) then 'png'
        elsif data.start_with?("\xFF\xD8".b) then 'jpg'
        elsif data.start_with?('GIF8') then 'gif'
        elsif data.start_with?("\x00\x00\x01\x00".b) then 'ico'
        elsif data.lstrip.start_with?('<svg', '<?xml') && !data.include?('<script') then 'svg'
        elsif data.start_with?('RIFF') && data[8, 4] == 'WEBP' then 'webp'
        end
  return nil unless ext

  map = File.join(ICONEN, soort)
  Dir.mkdir(ICONEN) unless Dir.exist?(ICONEN)
  Dir.mkdir(map) unless Dir.exist?(map)
  File.binwrite(File.join(map, "#{id}.#{ext}"), data)
  "/assets/images/iconen/#{soort}/#{id}.#{ext}"
rescue StandardError => e
  warn "✗ #{url}: #{e.message}"
  nil
end

def haal_op_binair(url, rest = 5)
  uri = URI(url)
  Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == 'https', open_timeout: 10, read_timeout: 15) do |http|
    antwoord = http.get(uri.request_uri, 'User-Agent' => 'OpenDiensten-iconen')
    if antwoord.is_a?(Net::HTTPRedirection) && rest.positive?
      return haal_op_binair(URI.join(url, antwoord['location']).to_s, rest - 1)
    end
    raise "HTTP #{antwoord.code}" unless antwoord.is_a?(Net::HTTPSuccess)
    raise 'groter dan 500 kB' if antwoord.body.bytesize > 500_000

    antwoord.body.b
  end
end

# Alle logo's van buiten (software, organisaties, diensten in de profielen) lokaal maken
def iconen
  bijwerken = lambda do |pad, &blok|
    data = JSON.parse(File.read(pad))
    veranderd = blok.call(data)
    File.write(pad, JSON.pretty_generate(data) + "\n") if veranderd
  end
  lokaal = lambda do |item, veld, soort, id|
    next false unless item[veld].to_s.match?(EXTERN)

    nieuw = icoon_downloaden(item[veld], soort, id)
    next false unless nieuw

    puts "✓ #{item[veld]} → #{nieuw}"
    item[veld] = nieuw
    true
  end
  bijwerken.call(SOFTWARE) { |d| d['software'].map { |s| lokaal.call(s, 'logo', 'software', s['id']) }.any? }
  bijwerken.call(ORGANISATIES) { |d| d['organisaties'].map { |o| lokaal.call(o, 'logo', 'organisaties', o['id']) }.any? }
  Dir[File.join(PROFIELEN, '*.json')].each do |f|
    profiel = File.basename(f, '.json')
    bijwerken.call(f) do |p|
      veranderd = lokaal.call(p, 'logo', 'profielen', profiel)
      (p['diensten'] || []).map { |d| d.is_a?(Hash) && !d['ref'] && lokaal.call(d, 'favicon', 'diensten', "#{profiel}-#{d['id']}") }.any? || veranderd
    end
  end
end

def paginas
  PAGINAS.each do |pg|
    Dir.mkdir(pg[:map]) unless Dir.exist?(pg[:map])
    JSON.parse(File.read(pg[:lijst]))[pg[:sleutel]].each do |x|
      pad = File.join(pg[:map], "#{x['id']}.md")
      next if File.exist?(pad)

      File.write(pad, "---\n#{pg[:veld]}: #{x['id']}\ntitle: #{x['naam'].to_json}\n---\n")
      puts "✓ #{File.basename(pg[:map])}/#{x['id']}.md"
    end
  end
end

case ARGV.first
when 'controleer' then controleer
when 'ophalen' then ophalen
when 'paginas' then paginas
when 'iconen' then iconen
else
  warn "Gebruik: ruby scripts/profielen.rb controleer | ophalen | paginas | iconen"
  exit 2
end
