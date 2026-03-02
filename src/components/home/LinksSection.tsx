'use client';

import React from 'react'
import Link from 'next/link'

const LinksSection = () => {
  const linkColumns = [
    {
      title: "Men's Shoes",
      links: [
        { text: 'Running', href: '/mens-running-shoes' },
        { text: 'Basketball', href: '/mens-basketball-shoes' },
        { text: 'Tennis', href: '/mens-tennis-shoes' },
        { text: 'Golf', href: '/mens-golf-shoes' },
      ]
    },
    {
      title: "Men's Clothing",
      links: [
        { text: 'Tops & T-Shirts', href: '/mens-tops-t-shirts' },
        { text: 'Jackets', href: '/mens-jackets' },
        { text: 'Hoodies', href: '/mens-hoodies' },
        { text: 'Pants', href: '/mens-pants' },
      ]
    },
    {
      title: "Men's Gear",
      links: [
        { text: "All Men's Gear", href: '/mens-gear' },
        { text: 'Socks', href: '/mens-socks' },
        { text: 'Bags & Backpacks', href: '/mens-bags-backpacks' },
        { text: 'Balls', href: '/balls' },
      ]
    },
    {
      title: "Featured",
      links: [
        { text: 'New Releases', href: '/new-releases' },
        { text: 'Sale', href: '/sale' },
        { text: 'NFL', href: '/nfl' },
        { text: "Men's Essentials", href: '/mens-essentials' },
      ]
    },
  ]

  return (
    <section className="toan-container py-14 border-t border-gray-200">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {linkColumns.map((column, idx) => (
          <div key={idx} className="space-y-3">
            <h3 className="text-base font-helvetica-medium">{column.title}</h3>
            <ul className="space-y-2">
              {column.links.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-500 hover:text-black transition-colors"
                  >
                    {link.text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

export default LinksSection
