'use client';

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import LanguageSwitcher from '../ui/LanguageSwitcher'
import { useLanguage } from '@/contexts/LanguageContext';
import { Twitter, Facebook, Youtube, Instagram, MapPin } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const Footer = () => {
  const { t } = useLanguage();
  const [isMounted, setIsMounted] = useState(false);
  // Removed manual email state
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const formSchema = z.object({
    email: z.string().email({
      message: t.common.error || "Email không hợp lệ.",
    }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onNewsletterSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email })
      });

      const data = await response.json();

      if (data.success) {
        form.reset();
        setMessage(data.message);
        setMessageType('success');
      } else {
        setMessage(data.message);
        setMessageType('error');
      }
    } catch (error) {
      setMessage(t.common.error);
      setMessageType('error');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const footerLinks = {
    featured: [
      { name: 'Air Force 1', href: '/air-force-1' },
      { name: 'Jordan 1', href: '/jordan-1' },
      { name: 'Air Max Dn', href: '/air-max-dn' },
      { name: 'Vomero', href: '/vomero' },
    ],
    shoes: [
      { name: 'All Shoes', href: '/shoes' },
      { name: 'Jordan Shoes', href: '/jordan-shoes' },
      { name: 'Running Shoes', href: '/running-shoes' },
      { name: 'Basketball Shoes', href: '/basketball-shoes' },
    ],
    clothing: [
      { name: 'All Clothing', href: '/clothing' },
      { name: 'Tops & T-Shirts', href: '/tops-t-shirts' },
      { name: 'Shorts', href: '/shorts' },
      { name: 'Hoodies & Pullovers', href: '/hoodies-pullovers' },
    ],
    kids: [
      { name: 'Infant & Toddler Shoes', href: '/kids/infant-toddler-shoes' },
      { name: 'Kids Shoes', href: '/kids-shoes' },
      { name: 'Kids Basketball Shoes', href: '/kids-basketball-shoes' },
      { name: 'Kids Running Shoes', href: '/kids-running-shoes' },
    ],
    help: [
      { name: t.footer.get_help, href: '/help' },
      { name: t.footer.order_status, href: '/orders' },
      { name: t.footer.shipping, href: '/help/shipping-delivery' },
      { name: t.footer.returns, href: '/help/returns' },
      { name: t.footer.cancellation, href: '/help/order-cancellation' },
      { name: t.footer.payment_options, href: '/help/payment-options' },
      { name: t.footer.vouchers, href: '/vouchers' },
      { name: t.footer.gift_card, href: '/gift-card-balance' },
      { name: t.footer.contact, href: '/help/contact' },
    ],
    company: [
      { name: t.footer.about_nike, href: '/about' },
      { name: t.footer.news, href: '/news' },
      { name: t.footer.careers, href: '/careers' },
      { name: t.footer.investors, href: '/investors' },
      { name: t.footer.purpose, href: '/purpose' },
      { name: t.footer.sustainability, href: '/sustainability' },
    ],
    promotions: [
      { name: t.footer.students, href: '/promo/student' },
      { name: t.footer.teachers, href: '/promo/teacher' },
      { name: t.footer.birthday, href: '/promo/birthday' },
    ]
  };

  return (
    <footer className="bg-[#111] text-white pt-10">
      <div className="nike-container">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 pb-10">
          {/* First section - Larger links */}
          <div className="space-y-4">
            <nav className="flex flex-col space-y-2">
              <Link href="/store" className="text-white font-helvetica-medium text-sm">
                {t.footer.find_store}
              </Link>
              <Link href="/sign-up" className="text-white font-helvetica-medium text-sm">
                {t.footer.join_member}
              </Link>
              <Link href="/about" className="text-white font-helvetica-medium text-sm">
                {t.footer.about_nike}
              </Link>
              <Link href="/help/contact" className="text-white font-helvetica-medium text-sm">
                {t.footer.feedback}
              </Link>
            </nav>
          </div>

          {/* Middle sections - GET HELP, ABOUT NIKE */}
          <div className="space-y-4">
            <h3 className="font-helvetica-medium text-sm">{t.footer.get_help}</h3>
            <nav className="flex flex-col space-y-2">
              {footerLinks.help.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-gray-400 hover:text-white text-xs"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-4">
            <h3 className="font-helvetica-medium text-sm">{t.footer.about_nike}</h3>
            <nav className="flex flex-col space-y-2">
              {footerLinks.company.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-gray-400 hover:text-white text-xs"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Last section - Promotions & Newsletter */}
          <div className="space-y-4">
            <h3 className="font-helvetica-medium text-sm">{t.footer.promotions}</h3>
            <nav className="flex flex-col space-y-2">
              {footerLinks.promotions.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-gray-400 hover:text-white text-xs"
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Newsletter */}
            <div className="pt-4 border-t border-gray-700 mt-6">
              <h4 className="font-helvetica-medium text-xs mb-2">{t.footer.signup_news}</h4>
              <p className="text-gray-400 text-xs mb-3">
                Nhận thông tin về sản phẩm mới, ưu đãi độc quyền
              </p>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onNewsletterSubmit)} className="space-y-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder={t.footer.email_placeholder}
                            {...field}
                            className="bg-white text-black text-sm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition disabled:opacity-50 font-medium text-sm"
                  >
                    {loading ? t.footer.subscribing : t.footer.subscribe}
                  </button>
                </form>
              </Form>

              {isMounted && message && (
                <p className={`text-xs mt-2 ${messageType === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                  {message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Social icons */}
        <div className="flex space-x-4 py-5">
          <a href="https://twitter.com/_thanhhtoann_" target="_blank" rel="noopener noreferrer" className="bg-gray-500 rounded-full p-2 hover:bg-white hover:text-gray-800 transition">
            <Twitter className="w-6 h-6" />
          </a>
          <a href="https://www.facebook.com/dtt6924" target="_blank" rel="noopener noreferrer" className="bg-gray-500 rounded-full p-2 hover:bg-white hover:text-gray-800 transition">
            <Facebook className="w-6 h-6" />
          </a>
          <a href="https://www.youtube.com/@thanhhtoann" target="_blank" rel="noopener noreferrer" className="bg-gray-500 rounded-full p-2 hover:bg-white hover:text-gray-800 transition">
            <Youtube className="w-6 h-6" />
          </a>
          <a href="https://www.instagram.com/_thanhhtoann_/" target="_blank" rel="noopener noreferrer" className="bg-gray-500 rounded-full p-2 hover:bg-white hover:text-gray-800 transition">
            <Instagram className="w-6 h-6" />
          </a>
        </div>

        {/* Bottom footer - Legal and location */}
        <div className="py-6 border-t border-gray-700 flex flex-col md:flex-row justify-between text-gray-400 text-[10px]">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <div className="flex items-center gap-4">
              <span className="flex items-center">
                <MapPin className="w-4 h-4" />
                <span className="ml-1">{t.footer.location}</span>
              </span>
              <LanguageSwitcher />
              <span>{t.footer.rights}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <Link href="/guides" className="hover:text-white">{t.footer.guides}</Link>
            <Link href="/terms" className="hover:text-white">{t.footer.terms_sale}</Link>
            <Link href="/terms-of-use" className="hover:text-white">{t.footer.terms_use}</Link>
            <Link href="/privacy-policy" className="hover:text-white">{t.footer.privacy}</Link>
            <Link href="/csr" className="hover:text-white">{t.footer.csr}</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
