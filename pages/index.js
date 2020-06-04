import { useState } from 'react'
import Head from 'next/head'
import { OptionGroup, Options, Option, OptionGroupLabel } from '../components/options'
import { match } from '../utils/match'

// An improvement could be that we get the language and currency for the current user. The language
// itself is not too hard: window.navigator.language can do the job. However the currency is a bit
// harder because we will need to do some conversion between USD and EUR for example. But this is a
// back-end / business problem so I am not going to worry about it here.
const formatter = new Intl.NumberFormat('en', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
})

function formatMoney(input) {
  return formatter.format(input / 100)
}

// Simulating an ID from the API. This is useful so that we can use this ID for the `key` so that
// React knows the identity of a certain element (for example when we insert / remove / re-arrange
// items). The main reason is so that once we implement the "real" API, we don't need to change the
// `key` prop if we used the `index` instead of an `ID`. In this case it doesn't really matter
// because we are not inserting / removing / re-arranging items, however it is a good practice to
// use an actual ID if we have that.
function attachFakeIds(items) {
  return items.map((item, index) => ({ id: `${index + 1}`, ...item }))
}

// Emulating an enum. The values could be anything e.g.: numbers (default in TypeScript), strings
// (might be easier for debugging reasons), symbols (to ensure that the consumer uses the actual
// enum instead of a hardcoded value).
const Orientation = { Horizontal: 0, Vertical: 1 }

// A fake product that contains the most important information.
const product = {
  name: 'Kemper Profiling Amp',
  // I mean, I've seen horrible things if you use floating points numbers especially for money
  // related things:
  //
  // window.location.href = `https://${0.1+0.2}.com`;
  basePrice: 179900,
  images: attachFakeIds([
    { src: '/img/kemper-front.jpg', label: 'Kemper front' },
    { src: '/img/kemper-angle.jpg', label: 'Kemper angle' },
    { src: '/img/kemper-rear.jpg', label: 'Kemper rear' },
  ]),
  categoryOptions: attachFakeIds([
    {
      title: 'Form Factor',
      // This is not really a value you get from your API directly. However there could be another
      // indicator (is it nullable? are there only 2 options? are there no `none` options? ...). For
      // simplicity I "hardcoded" it right here, but in the real world you could imagine that there
      // is some mapping layer.
      preferredOrientation: Orientation.Horizontal,
      options: attachFakeIds([
        {
          title: 'Profiler Head',
          description: 'Compact amplifier head, perfect for a speaker cabinet or desk.',
          price: 0,
        },
        {
          title: 'Profiler Rack',
          description: '3U rackmount version of the classic profiling amplifier.',
          price: 0,
        },
      ]),
    },
    {
      title: 'Power Amp',
      preferredOrientation: Orientation.Vertical,
      options: attachFakeIds([
        {
          title: 'None',
          description: 'Use in the studio or with your own power amp.',
          price: 0,
        },
        {
          title: 'Powered',
          description: 'Built-in 600W solid state power amp.',
          price: 44900,
        },
      ]),
    },
    {
      title: 'Foot Controller',
      preferredOrientation: Orientation.Vertical,
      options: attachFakeIds([
        { title: 'None', price: 0 },
        { title: 'Profiler Remote Foot Controller', price: 44900 },
      ]),
    },
  ]),
  specifications: attachFakeIds([
    { key: 'Amp Models', value: 200 },
    { key: 'Effects Loop', value: 'Yes' },
    { key: 'Inputs', value: '2 x 1/4”' },
    { key: 'Outputs', value: '1 x 1/4”, 2 x XLR, 2 x 1/4”' },
    { key: 'MIDI I/O', value: 'In/Out/Thru' },
    { key: 'Height', value: '8.54”' },
    { key: 'Width', value: '14.88”' },
    { key: 'Depth', value: '6.81”' },
    { key: 'Weight', value: '11.73 lbs' },
  ]),
}

export default function Home() {
  // Made the assumption that we at least have a single image. If we don't have images at all we
  // could provide an empty state view or something similar.
  const [activeImageId, setActiveImageId] = useState(product.images[0].id)

  // Let's create a simple lookup table so that we can lookup a certain option by the category ID
  // and the option ID. The data is not that big so looping through all the options might not be a
  // big deal. However, this lookup table can scale nicely and is pretty nice to work with.
  const categoryWithOptionsLookup = Object.assign(
    ...product.categoryOptions.map((category) => ({
      [category.id]: Object.assign(...category.options.map((option) => ({ [option.id]: option }))),
    }))
  )

  // A lookup table for the selected option per category.
  const [selectedOptions, setSelectedOptions] = useState(() => {
    return Object.assign(
      ...product.categoryOptions.map((category) => ({
        // Let's select the first option by default.
        [category.id]: category.options[0].id,
      }))
    )
  })

  // Find the active image based on the ID.
  const activeImage = product.images.find(({ id }) => id === activeImageId)

  // Sum all the selected options so that we can update the price.
  const priceOfOptions = Object.entries(selectedOptions).reduce((total, [categoryId, optionId]) => {
    return total + categoryWithOptionsLookup[categoryId][optionId].price
  }, 0)

  const totalPrice = product.basePrice + priceOfOptions

  return (
    <div className="flex flex-col min-h-screen font-sans antialiased">
      <Head>
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
        <title>{product.name}</title>
      </Head>

      <form
        onSubmit={(event) => {
          event.preventDefault()

          // Totally stupid / unnecessary, but wanted to show _something_ when the buy button was
          // pressed.
          const summary = [
            `${product.name} (Base price: ${formatMoney(product.basePrice)})`,
            '',
            ...product.categoryOptions.map((category) => {
              const selectedOption =
                categoryWithOptionsLookup[category.id][selectedOptions[category.id]]

              return ` - ${category.title}: ${selectedOption.title} (${formatMoney(
                selectedOption.price
              )})`
            }),
            '',
            `Total: ${formatMoney(totalPrice)}`,
          ]

          alert(summary.join('\n'))
        }}
      >
        <div className="sm:py-2">
          <div className="flex-1 px-4 py-12 mx-auto md:max-w-2xl lg:max-w-5xl xl:max-w-7xl lg:px-8 sm:px-12 sm:py-16">
            <div className="space-y-6" role="banner">
              <div className="space-y-4 sm:space-y-3">
                <h1 className="text-4xl font-extrabold leading-10 tracking-tight text-gray-900">
                  Get your {product.name}
                </h1>

                <h2 className="text-xl leading-7 text-gray-500">
                  All your favorite amps and effects, together in one little box.
                </h2>
              </div>
            </div>

            <hr className="mt-5 border-gray-300 mb-9 border-px lg:mt-6 lg:mb-12" />

            <main className="grid grid-cols-1 lg:grid-cols-2 gap-9">
              <div>
                <div className="sticky grid grid-cols-1 gap-4 top-8">
                  {/* Main image */}
                  <div className="overflow-hidden border border-gray-200 rounded-lg shadow-sm">
                    {/* Using some padding percentage hacks to create some sort of aspect ratio container. */}
                    {/* The images are 144x96. Which is 1.5. Thank you tailwind for the pb-2/3 class! */}
                    <div className="relative w-full h-full pb-2/3">
                      <img
                        className="absolute w-full h-full"
                        src={activeImage.src}
                        alt={activeImage.label}
                      />
                    </div>
                  </div>

                  {/* List of thumbnails */}
                  <OptionGroup active={activeImageId} onChange={setActiveImageId}>
                    <OptionGroupLabel className="sr-only">Selected image:</OptionGroupLabel>
                    <Options className="grid grid-flow-col gap-4 focus:outline-none">
                      {product.images.map((image) => (
                        // I abstracted this to a component just to prove that it is possible. Aka
                        // used context under the hood.
                        <ImageOption key={image.id} image={image} />
                      ))}
                    </Options>
                  </OptionGroup>
                </div>
              </div>
              <div className="space-y-6">
                {/* Starting price */}
                <div className="space-y-1">
                  <div className="text-sm font-medium leading-5 text-gray-500">Starting at</div>
                  <div className="text-5xl font-extrabold leading-none tracking-tight text-gray-900">
                    {formatMoney(product.basePrice)}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-4">
                  <p className="text-lg leading-6 text-gray-900">
                    The KEMPER PROFILER™ is the leading-edge digital guitar amplifier and all-in-one
                    effects processor.
                  </p>

                  <p className="leading-6 text-gray-500">
                    Hailed as a game-changer by guitarists the world over, the PROFILER™ is the
                    first digital guitar amp to really nail the full and dynamic sound of a guitar
                    or bass amp.
                  </p>

                  <p className="leading-6 text-gray-500">
                    This is made possible by a radical, patented technology and concept which we
                    call "PROFILING".
                  </p>
                </div>

                <div className="pt-6">
                  <div className="space-y-12">
                    {/* The options */}
                    {product.categoryOptions.map((category) => {
                      const selectedOptionPrice =
                        categoryWithOptionsLookup[category.id][selectedOptions[category.id]].price

                      return (
                        <OptionGroup
                          key={category.id}
                          className="space-y-2"
                          active={selectedOptions[category.id]}
                          onChange={(optionId) => {
                            return setSelectedOptions((existing) => ({
                              ...existing,
                              [category.id]: optionId,
                            }))
                          }}
                        >
                          <OptionGroupLabel className="text-lg font-medium leading-7 text-gray-900">
                            {category.title}
                          </OptionGroupLabel>

                          <Options
                            className={classNames(
                              'focus:outline-none grid gap-4',
                              match(category.preferredOrientation, {
                                [Orientation.Horizontal]: 'sm:grid-flow-col',
                                [Orientation.Vertical]: 'sm:grid-flow-row',
                              })
                            )}
                          >
                            {category.options.map((option) => {
                              const { id, price, title, description } = option

                              // We want to display the price of the option relative to the selected
                              // option. This means that a cheaper option will show a negative value
                              // to indicate that you can "save" some money if you want.
                              const displayPrice = price - selectedOptionPrice

                              // We could abstract this to a <PricingOption /> component for
                              // readability, but it's the only place it is used currently so not
                              // going to bother with refactoring this for now.
                              return (
                                <Option
                                  key={id}
                                  value={id}
                                  className="flex-1 rounded-lg shadow-sm cursor-pointer focus:outline-none"
                                >
                                  {(state) => (
                                    <div
                                      className={classNames(
                                        'transition duration-150 ease-in-out overflow-hidden rounded-lg h-full',
                                        // As mentioned in the readme, I am pretty verbose here.
                                        matchFlag(state, {
                                          [Option.state.Default]: matchFlag(state, {
                                            [Option.state.Default]: 'border p-px border-gray-300',
                                            [Option.state.Active]: 'border p-px border-gray-400',
                                          }),
                                          [Option.state.Selected]: matchFlag(state, {
                                            [Option.state.Selected]: 'border-2 p-0 border-gray-700',
                                            [Option.state.Focused]:
                                              'border-2 p-0 border-gray-700 shadow-outline-gray',
                                          }),
                                        })
                                      )}
                                    >
                                      <div className="flex justify-between h-full px-6 py-5">
                                        <div className="space-y-2">
                                          <div className="text-sm font-medium leading-5 text-gray-900">
                                            {title}
                                          </div>

                                          {/* I have the habit to be explicit, therefore I used a `Boolean(value)` instead of the more magic `!!value`. */}
                                          {Boolean(description) && (
                                            <div className="text-sm leading-5 text-gray-500">
                                              {description}
                                            </div>
                                          )}
                                        </div>

                                        {/* Watch out! `0` is falsey, however I don't want to render falseys nor the value 0. */}
                                        {Boolean(displayPrice) && (
                                          <span className="flex items-center flex-shrink-0 text-sm leading-5 text-gray-900 ">
                                            {match(Math.sign(displayPrice), {
                                              // Positive prices should have a `+` in front of the
                                              // value.
                                              [1]: '+ ',

                                              // This should never happen (because we don't want to
                                              // render the price 0), but since Math.sign returns
                                              // -1, 0 or 1, I'll add it for completeness.
                                              [0]: '',

                                              // Negative prices should have a `-` in front of the
                                              // value.
                                              [-1]: '- ',
                                            })}

                                            {/* We want to prevent that a double `- -` is visible, so therefore we can take the absolute value. */}
                                            {formatMoney(Math.abs(displayPrice))}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </Option>
                              )
                            })}
                          </Options>
                        </OptionGroup>
                      )
                    })}

                    {/* The specifications */}
                    <div className="space-y-2">
                      <div className="text-lg font-medium leading-7 text-gray-900">
                        Specifications
                      </div>
                      <dl className="flex flex-col border-t border-b border-gray-200 divide-y divide-gray-200">
                        {product.specifications.map((specification) => {
                          return (
                            <div
                              key={specification.id}
                              className="flex items-center justify-between py-4"
                            >
                              <dt className="text-sm font-medium leading-5 text-gray-900">
                                {specification.key}
                              </dt>
                              <dd className="text-sm leading-5">{specification.value}</dd>
                            </div>
                          )
                        })}
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>

        <footer className="sticky bottom-0 border-t border-gray-200 bg-gray-50">
          <div className="px-4 py-6 mx-auto md:max-w-2xl lg:max-w-5xl xl:max-w-7xl lg:px-8 sm:px-12">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 xl:grid-cols-4">
              <dl className="hidden grid-flow-row gap-4 lg:col-span-2 lg:gap-8 lg:grid-flow-col sm:grid">
                <div>
                  <dt className="sr-only">Shipping</dt>
                  <dd className="flex items-start space-x-3 text-sm leading-5">
                    <svg
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      className="flex-shrink-0 w-5 h-5 text-gray-400"
                    >
                      <path
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z"
                        clipRule="evenodd"
                        fillRule="evenodd"
                      />
                    </svg>

                    <div className="space-y-1">
                      <div className="font-medium text-gray-900">Free Shipping</div>
                      <div className="hidden text-gray-500 lg:block">
                        Get 2-day free shipping anywhere in North America.
                      </div>
                    </div>
                  </dd>
                </div>
                <div>
                  <dt className="sr-only">Warranty</dt>
                  <dd className="flex items-start space-x-3 text-sm leading-5">
                    <svg
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      className="flex-shrink-0 w-5 h-5 text-gray-400"
                    >
                      <path
                        d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                        fillRule="evenodd"
                      />
                    </svg>

                    <div className="space-y-1">
                      <div className="font-medium text-gray-900">2 Year Warranty</div>
                      <div className="hidden text-gray-500 lg:block">
                        If anything goes wrong in the first two years, we'll replace it for free.
                      </div>
                    </div>
                  </dd>
                </div>
              </dl>
              <div className="flex items-center justify-end space-x-6 sm:col-span-2 lg:col-span-1 xl:col-span-2">
                <div className="flex flex-col space-y-1 text-right">
                  <div className="text-3xl font-bold leading-9 tracking-tight text-gray-900">
                    {formatMoney(totalPrice)}
                  </div>
                  <div className="hidden text-sm leading-5 text-gray-500 whitespace-no-wrap sm:block">
                    {/* I did notice the `a` on smaller screens, but I implemented it like this for consistency. */}
                    Need financing?{' '}
                    <a
                      href="#"
                      // Neat little trick here, a padding and a negative margin of the same size
                      // ensure that the "normal" state looks good (no extra space), and that the
                      // focused state also looks good (the outline is not squished to the text)!
                      className="p-1 -m-1 underline rounded focus:outline-none focus:shadow-outline-gray"
                    >
                      Learn more
                    </a>
                  </div>
                </div>
                <button
                  type="submit"
                  className="flex-shrink-0 px-4 py-2 text-base font-medium leading-5 text-white transition duration-150 ease-in-out bg-gray-900 rounded-md xl:px-5 xl:py-3 hover:bg-gray-700 focus:outline-none focus:shadow-outline-gray"
                >
                  Buy now
                </button>
              </div>
            </div>
          </div>
        </footer>
      </form>
    </div>
  )
}

/**
 * The only reason I extracted a component here is to show you that it is _possible_ to extract a
 * component for this. In other words, if I didn't use context under the hood, I would have to pass
 * through all the relevant props deeply.
 */
function ImageOption(props) {
  const { image } = props
  const { Default, Active, Selected, Focused } = Option.state

  return (
    <Option value={image.id} className="rounded-lg shadow-sm cursor-pointer focus:outline-none">
      {(state) => {
        /**
         * Here is another cool trick. You can ignore the state value you get from the callback, add
         * a `state = Selected | Focused` and you can now see your component in this exact state.
         * Think about this for a second, we are in "user land" and we can mimic every state! We
         * didn't even need to expose an API to make this possible!
         *
         * Uncomment the following line to see the component in a hardcoded state:
         */
        // state = Selected | Focused

        /**
         * Another cool trick is that you can wrap this low level API in an API that you might like
         * better. This is something that could be exposed from the library or implemented in user
         * land E.g.:
         *
         * function isActive() { return Boolean(state & Active) }
         * function isFocused() { return Boolean(state & Focused) }
         * function isSelected() { return Boolean(state & Selected) }
         */
        return (
          <div
            className={classNames(
              'transition duration-150 ease-in-out overflow-hidden rounded-lg flex items-center justify-center',
              matchFlag(state, {
                // We can either be in the Default state.
                [Default]: matchFlag(state, {
                  // Once we are in the Default state, we can have styles for the Default state
                  // as-is.
                  [Default]: 'border p-px border-gray-200',
                  // Or we can have styles for when we are in the Default AND Active state at the
                  // same time.
                  [Active]: 'border p-px border-gray-400',
                }),
                // Or we can be in the Selected state.
                [Selected]: matchFlag(state, {
                  [Selected]: 'border-2 p-0 border-gray-700',
                  [Focused]: 'border-2 p-0 border-gray-700 shadow-outline-gray',
                }),
              })
            )}
          >
            {/* Using some padding percentage hacks to create some sort of aspect ratio container. */}
            <div className="relative w-full h-full pb-2/3">
              <img className="absolute w-full h-full" src={image.src} alt={image.label} />
            </div>
          </div>
        )
      }}
    </Option>
  )
}

function matchFlag(state, lookup) {
  // To make things easier, we can sort the keys so that we can find the "best" match. The used
  // heuristic is the actual number representation.
  const flags = Object.keys(lookup).sort((a, b) => Math.sign(b - a))

  for (let flag of flags) {
    if (state & flag) {
      return lookup[flag]
    }
  }
}

// Who needs a library?
function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}
